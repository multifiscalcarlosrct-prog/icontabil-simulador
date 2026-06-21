// Controller da simulação (núcleo). Aqui o motor de cálculo entra MOCKADO no MVP.
import * as motorDecisao from '../services/motorDecisao.js';
import * as pdfService from '../services/pdfService.js';
import * as cotaService from '../services/cotaService.js';
import * as cnpjService from '../services/cnpjService.js';
import * as leadService from '../services/leadService.js';
import * as consultaRepo from '../db/repositories/consultaRepo.js';
import { validaCnpj } from '../utils/validaCnpj.js';

// POST /api/simulacao
export async function simular(req, res, next) {
  try {
    const { cnpj: cnpjRaw, faturamento, pctPJ, pesoInsumos, setor, folhaPagamento } = req.body || {};
    const cnpj = String(cnpjRaw || '').replace(/\D/g, '');
    if (!validaCnpj(cnpj)) return res.status(400).json({ erro: 'CNPJ inválido.' });

    const usuarioId = req.usuario.id;

    // O resultado é SEMPRE recalculado com os dados atuais (reflete faturamento/% atuais e
    // a calibração vigente). O cache serve só para a COTA: se este CNPJ já foi consultado
    // por esta conta, não debita crédito novo (seção 6) — apenas atualiza o resultado.
    const existente = consultaRepo.acharPorUsuarioECnpj(usuarioId, cnpj);

    // UF/município do cadastro alimentam a Calculadora oficial (fonte da alíquota).
    const cadastro = await cnpjService.buscarCadastral(cnpj).catch(() => ({}));
    const cnpjFmt = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

    // OPÇÃO A: a comparação puro vs. híbrido (CGSN 186/2026) é exclusiva de optante do Simples.
    // Bloqueia quando o cadastro indica NÃO-optante (optanteSimples=false OU porte "DEMAIS",
    // que não é ME/EPP) — mas captura o lead (ótimo lead) e NÃO debita crédito. null/ME/EPP segue.
    if (cadastro.naoOptante) {
      const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
      leadService
        .enviarLead({
          tipo: 'nao_optante_simples',
          contato: req.usuario.contato,
          whatsapp: req.usuario.whatsapp || null,
          nome: cadastro.razaoSocial || '(razão social indisponível)',
          cnpj: cnpjFmt,
          regime_atual: 'Não optante pelo Simples',
          optante_simples: false,
          setor: String(setor || '').toLowerCase(),
          faturamento: brl.format(Number(faturamento) || 0),
          pct_pj: Math.round(Number(pctPJ) || 0),
        })
        .catch(() => {});
      return res.json({
        naoOptante: true,
        nome: cadastro.razaoSocial || null,
        cnpj: cnpjFmt,
        creditosRestantes: cotaService.creditosRestantes(usuarioId), // não debita
      });
    }

    // NÚCLEO — motor de decisão (regra de ouro da seção 4 + Calculadora como fonte de alíquota).
    const resultado = await motorDecisao.comparar({
      cnpj,
      faturamento,
      pctPJ,
      pesoInsumos,
      setor,
      folhaPagamento,
      uf: cadastro.uf,
      municipio: cadastro.municipio,
    });

    let id;
    if (existente) {
      consultaRepo.atualizar({ id: existente.id, payload: resultado }); // mesmo CNPJ → não debita
      id = existente.id;
    } else {
      id = consultaRepo.gravar({ usuarioId, cnpj, payload: resultado }); // novo CNPJ → consome cota

      // Lead qualificado (seção 8): cada novo CNPJ simulado vira um lead.
      // Campos alinhados aos scripts do N8N (SCRIPTS_WHATSAPP.md): nome, recomendacao,
      // pct_pj, faturamento, setor, cnpj, creditos, regime_atual.
      // Best-effort: não bloqueia a resposta nem falha a simulação se o N8N estiver fora.
      const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
      // regime_atual vem do cadastro (BrasilAPI: opção pelo Simples) — não é mais fixo.
      const optante = cadastro.optanteSimples;
      const regimeAtual =
        optante === true ? 'Simples Nacional' : optante === false ? 'Não optante pelo Simples' : 'Não identificado';
      leadService
        .enviarLead({
          tipo: 'simulacao',
          contato: req.usuario.contato, // e-mail
          whatsapp: req.usuario.whatsapp || null, // 55+DDD+número — base da nutrição
          nome: cadastro.razaoSocial || '(razão social indisponível)',
          cnpj: cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
          regime_atual: regimeAtual,
          optante_simples: optante ?? null, // true | false | null (cadastro indisponível)
          recomendacao: resultado.recomendacao, // 'puro' | 'hibrido'
          forca: resultado.forca,
          setor: resultado.entrada.setor,
          faturamento: brlFmt.format(resultado.entrada.faturamentoAnual),
          pct_pj: Math.round(resultado.entrada.pctPJ * 100),
          creditos: cotaService.creditosRestantes(usuarioId),
        })
        .catch(() => {});
    }

    res.json({
      id,
      reaproveitado: !!existente, // true = CNPJ repetido, não consumiu novo crédito
      resultado,
      creditosRestantes: cotaService.creditosRestantes(usuarioId), // null = ilimitado
      ilimitado: cotaService.planoIlimitado(usuarioId),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/simulacao/:id/pdf
export async function baixarPdf(req, res, next) {
  try {
    const consulta = consultaRepo.acharPorId(req.params.id);
    if (!consulta || consulta.usuario_id !== req.usuario.id) {
      return res.status(404).json({ erro: 'Simulação não encontrada.' });
    }
    const pdf = await pdfService.gerar(JSON.parse(consulta.payload_resultado));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="relatorio-${consulta.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
}

// GET /api/cota
export async function cota(req, res, next) {
  try {
    res.json({
      creditosRestantes: cotaService.creditosRestantes(req.usuario.id), // null = ilimitado
      ilimitado: cotaService.planoIlimitado(req.usuario.id),
    });
  } catch (err) {
    next(err);
  }
}
