// Integração com a Calculadora oficial IBS/CBS (Regime Geral) — seção 3 do CLAUDE.md.
// A Calculadora é um motor POR OPERAÇÃO; aqui a usamos para estimar a alíquota efetiva
// PADRÃO do regime regular (sonda de R$ 10.000). Sem CALCULADORA_URL, opera mockado.
import { env } from '../config/env.js';
import { tributos } from '../config/tributos.js';
import { ROTA_REGIME_GERAL, operacaoRepresentativa as OP } from '../config/calculadora.js';

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Data no formato exigido pela Calculadora: 'yyyy-MM-ddTHH:mm:ss-03:00' (sem milissegundos).
function dataHoraEmissao() {
  return `${OP.dataReferencia}T12:00:00-03:00`;
}

// Monta o IOperacaoInput (contrato oficial) para a operação representativa padrão.
export function montaOperacao({ uf, municipioIBGE, valor }) {
  return {
    id: OP.id,
    versao: OP.versao,
    dataHoraEmissao: dataHoraEmissao(),
    uf: uf || OP.ufPadrao,
    municipio: municipioIBGE || OP.municipioIBGEPadrao,
    itens: [
      {
        numero: 1,
        ncm: OP.ncm,
        cst: OP.cst,
        cClassTrib: OP.cClassTrib,
        baseCalculo: num(valor),
        quantidade: OP.quantidade,
        unidade: OP.unidade,
      },
    ],
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
export async function calcularOperacao({ uf, municipioIBGE, valor }) {
  if (!env.calculadoraUrl) return mock(valor);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000); // não trava a simulação se o piloto demorar
  try {
    const resp = await fetch(`${env.calculadoraUrl}${ROTA_REGIME_GERAL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(montaOperacao({ uf, municipioIBGE, valor })),
      signal: ctrl.signal,
    });
    if (!resp.ok) throw new Error(`Calculadora oficial retornou ${resp.status}`);
    return extraiTotais(await resp.json(), valor);
  } finally {
    clearTimeout(t);
  }
}

// A alíquota PADRÃO é uniforme nacionalmente no piloto (estados ainda não fixam alíquota
// própria), então usamos uma operação representativa única (UF/município padrão) e cacheamos
// um só valor — evita descasamento UF×município e deixa a simulação rápida.
let cacheAliquota = null;

// Alíquota efetiva de IBS/CBS (total/valor): a "fonte confiável" da carga do regime regular.
// Em qualquer falha, cai na alíquota de referência (estimativa) e NÃO cacheia (tenta de novo).
export async function aliquotaEfetiva() {
  if (cacheAliquota) return cacheAliquota;
  const base = 10_000;
  try {
    const r = await calcularOperacao({ valor: base }); // usa UF/município padrão (representativo)
    const aliquota = r.total / base;
    if (aliquota > 0) {
      const res = { aliquota, fonte: r._fonte };
      if (r._fonte === 'calculadora') cacheAliquota = res; // cacheia só o oficial
      return res;
    }
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
