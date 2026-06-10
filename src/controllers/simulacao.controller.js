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

      // Lead qualificado (seção 8): cada novo CNPJ simulado vira um lead com regime + faturamento.
      // Best-effort: não bloqueia a resposta nem falha a simulação se o N8N estiver fora.
      leadService
        .enviarLead({
          tipo: 'simulacao',
          contato: req.usuario.contato,
          cnpj,
          razaoSocial: cadastro.razaoSocial || null,
          regimeRecomendado: resultado.recomendacao, // 'puro' | 'hibrido'
          forca: resultado.forca,
          faturamentoAnual: resultado.entrada.faturamentoAnual,
          setor: resultado.entrada.setor,
          pctPJ: resultado.entrada.pctPJ,
        })
        .catch(() => {});
    }

    res.json({
      id,
      reaproveitado: !!existente, // true = CNPJ repetido, não consumiu novo crédito
      resultado,
      creditosRestantes: cotaService.creditosRestantes(usuarioId),
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
    res.json({ creditosRestantes: cotaService.creditosRestantes(req.usuario.id) });
  } catch (err) {
    next(err);
  }
}
