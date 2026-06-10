// Integração com a Calculadora oficial IBS/CBS (Regime Geral) — seção 3 do CLAUDE.md.
// A Calculadora é um motor POR OPERAÇÃO; aqui a usamos para estimar a alíquota efetiva
// do regime regular por localidade. Sem CALCULADORA_URL configurada, opera mockado.
import { env } from '../config/env.js';
import { tributos } from '../config/tributos.js';
import { ROTA_REGIME_GERAL, operacaoRepresentativa as OP } from '../config/calculadora.js';

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Monta o IOperacaoInput (contrato oficial) para uma operação representativa.
export function montaOperacao({ uf, municipioIBGE, valor, setor }) {
  const cls = OP.porSetor[String(setor || '').toLowerCase()] || OP.porSetor._padrao;
  const item = {
    numero: 1,
    cst: OP.cst,
    cClassTrib: OP.cClassTrib,
    baseCalculo: num(valor),
    quantidade: OP.quantidade,
    unidade: OP.unidade,
  };
  item[cls.tipo] = cls.codigo; // 'ncm' OU 'nbs'
  return {
    dataHoraEmissao: new Date().toISOString(),
    uf: uf || OP.ufPadrao,
    municipio: municipioIBGE || OP.municipioIBGEPadrao,
    itens: [item],
  };
}

// Extrai CBS/IBS/IS dos TOTAIS da resposta do regime-geral.
export function extraiTotais(data, valor) {
  const tot = data?.total?.tribCalc || {};
  const ibsCbs = tot.IBSCBSTot || {};
  const ibs = num(ibsCbs?.gIBS?.vIBS); // IBS total (UF + Município)
  const cbs = num(ibsCbs?.gCBS?.vCBS); // CBS (União)
  const is = num(tot?.ISTot?.vIS);
  return {
    cbs,
    ibs,
    is,
    total: +(cbs + ibs).toFixed(2),
    base: num(ibsCbs?.vBCIBSCBS) || num(valor),
    _fonte: 'calculadora',
  };
}

// Calcula os tributos de UMA operação na Calculadora oficial. Lança em caso de falha.
export async function calcularOperacao({ uf, municipioIBGE, valor, setor }) {
  if (!env.calculadoraUrl) return mock(valor);
  const resp = await fetch(`${env.calculadoraUrl}${ROTA_REGIME_GERAL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(montaOperacao({ uf, municipioIBGE, valor, setor })),
  });
  if (!resp.ok) throw new Error(`Calculadora oficial retornou ${resp.status}`);
  return extraiTotais(await resp.json(), valor);
}

// Alíquota efetiva de IBS/CBS (total/valor). É a "fonte confiável" da carga do regime regular
// para o motor de decisão. Em qualquer falha, cai na alíquota de referência (estimativa).
export async function aliquotaEfetiva({ uf, municipioIBGE, setor } = {}) {
  const base = 10_000;
  try {
    const r = await calcularOperacao({ uf, municipioIBGE, valor: base, setor });
    const aliquota = r.total / base;
    if (aliquota > 0) return { aliquota, fonte: r._fonte };
  } catch {
    /* abaixo: fallback */
  }
  return { aliquota: tributos.aliquotaReferencia, fonte: 'referencia' };
}

// Estimativa provisória usada quando não há Calculadora configurada (alíquota ~26,5%).
function mock(valor = 0) {
  const cbs = +(num(valor) * 0.088).toFixed(2);
  const ibs = +(num(valor) * 0.177).toFixed(2);
  return { cbs, ibs, is: 0, total: +(cbs + ibs).toFixed(2), base: num(valor), _fonte: 'mock' };
}
