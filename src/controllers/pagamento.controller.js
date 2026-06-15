// Pagamento do plano ilimitado (Pix, R$ 9,99 — pagamento único).
// Fluxo: criar cobrança → usuário paga → confirmação (status/webhook) →
//        usuarios.plano = 'pago' (ilimitado) + lead 'paywall_convertido' (alerta no Telegram).
import { env } from '../config/env.js';
import * as pix from '../services/pagamento/index.js';
import * as pagamentoRepo from '../db/repositories/pagamentoRepo.js';
import * as usuarioRepo from '../db/repositories/usuarioRepo.js';
import * as leadService from '../services/leadService.js';

const ehEmail = (s) => /.+@.+\..+/.test(String(s || ''));

// Efetiva o pagamento UMA única vez: libera o plano e dispara o lead de conversão.
function confirmarPagamento(pagamento) {
  const efetivou = pagamentoRepo.marcarPago(pagamento.txid); // true só na 1ª vez (idempotente)
  if (!efetivou) return;
  usuarioRepo.marcarPago(pagamento.usuario_id);

  const u = usuarioRepo.acharPorId(pagamento.usuario_id);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  leadService
    .enviarLead({
      tipo: 'paywall_convertido',
      contato: u?.contato || null,
      whatsapp: u?.whatsapp || null,
      nome: u?.contato || 'Cliente',
      valor: brl.format(pagamento.valor_centavos / 100),
      provedor: pagamento.provedor,
    })
    .catch(() => {});
}

// POST /api/pagamento/criar  (exige conta verificada)
export async function criar(req, res, next) {
  try {
    if (!env.pixProvider) return res.status(503).json({ erro: 'Pagamento indisponível no momento.' });

    // Já é pago: não cobra de novo.
    if (req.usuario.plano === 'pago') return res.json({ jaPago: true });

    const valorCentavos = env.planoPrecoCentavos;
    const cobranca = await pix.criarCobranca({
      valorCentavos,
      descricao: 'iContábil IA — Plano ilimitado',
      email: ehEmail(req.usuario.contato) ? req.usuario.contato : undefined,
    });

    pagamentoRepo.criar({
      usuarioId: req.usuario.id,
      provedor: pix.nomeProvedor(),
      txid: cobranca.txid,
      valorCentavos,
    });

    res.json({
      txid: cobranca.txid,
      qrCode: cobranca.qrCode,
      qrCodeBase64: cobranca.qrCodeBase64,
      valorCentavos,
      status: 'pendente',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/pagamento/status/:txid  (front faz polling; também confirma se já pagou)
export async function status(req, res, next) {
  try {
    const pagamento = pagamentoRepo.acharPorTxid(req.params.txid);
    if (!pagamento || pagamento.usuario_id !== req.usuario.id) {
      return res.status(404).json({ erro: 'Cobrança não encontrada.' });
    }
    if (pagamento.status === 'pago') return res.json({ status: 'pago' });

    const st = await pix.consultarStatus(pagamento.txid, { criadoEm: pagamento.criado_em });
    if (st === 'pago') confirmarPagamento(pagamento);
    res.json({ status: st });
  } catch (err) {
    next(err);
  }
}

// POST /api/pagamento/webhook  (provedor chama; sem auth). Nunca confia no corpo:
// re-consulta o status real no provedor antes de liberar.
export async function webhook(req, res, next) {
  try {
    const ref = pix.parseWebhook(req);
    if (ref?.txid) {
      const pagamento = pagamentoRepo.acharPorTxid(ref.txid);
      if (pagamento && pagamento.status !== 'pago') {
        const st = await pix.consultarStatus(pagamento.txid, { criadoEm: pagamento.criado_em });
        if (st === 'pago') confirmarPagamento(pagamento);
      }
    }
    res.sendStatus(200); // sempre 200: evita reentregas em loop do provedor
  } catch (err) {
    // não propaga erro ao provedor (geraria retentativas); loga e responde 200.
    if (env.nodeEnv !== 'production') console.error('[PAGAMENTO webhook]', err.message);
    res.sendStatus(200);
  }
}
