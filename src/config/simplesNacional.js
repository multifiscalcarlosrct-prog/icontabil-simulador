// Carga de IBS/CBS embutida no DAS do Simples Nacional — derivada das tabelas oficiais
// da LC 123/2006 (faixas de receita + partilha por tributo). É a base do cenário "puro"
// na comparação puro vs. híbrido.
//
// CONCEITO: dentro do DAS, a fatia que será substituída por IBS/CBS é
//   CBS ← PIS + COFINS      e      IBS ← ICMS (comércio/indústria) ou ISS (serviços).
// Logo: parcela sobre a receita = alíquota efetiva do Simples × (essa fatia, em % do DAS).
// O IPI (Anexo II) NÃO entra (não é substituído por IBS/CBS), por isso é excluído da fatia.
//
// FONTE das tabelas: partilha do Simples Nacional, Anexos I, II, III e V (ver
// docs/calibracao-simples.md). ⚠️ REVISAR/HOMOLOGAR com o contador responsável (CRC)
// antes de uso em produção — números fiscais exigem conferência.

// Cada faixa: ate = limite superior da RBT12; nominal = alíquota nominal; deduz = parcela a
// deduzir; shareIbsCbs = fração do DAS correspondente a IBS/CBS (PIS+COFINS+ICMS/ISS).
const ANEXOS = {
  I: {
    nome: 'I — Comércio',
    faixas: [
      { ate: 180000, nominal: 0.04, deduz: 0, shareIbsCbs: 0.495 },
      { ate: 360000, nominal: 0.073, deduz: 5940, shareIbsCbs: 0.495 },
      { ate: 720000, nominal: 0.095, deduz: 13860, shareIbsCbs: 0.495 },
      { ate: 1800000, nominal: 0.107, deduz: 22500, shareIbsCbs: 0.495 },
      { ate: 3600000, nominal: 0.143, deduz: 87300, shareIbsCbs: 0.495 },
      { ate: 4800000, nominal: 0.19, deduz: 378000, shareIbsCbs: 0.344 }, // ICMS fora do DAS (sublimite)
    ],
  },
  II: {
    nome: 'II — Indústria',
    faixas: [
      { ate: 180000, nominal: 0.045, deduz: 0, shareIbsCbs: 0.46 },
      { ate: 360000, nominal: 0.078, deduz: 5940, shareIbsCbs: 0.46 },
      { ate: 720000, nominal: 0.1, deduz: 13860, shareIbsCbs: 0.46 },
      { ate: 1800000, nominal: 0.112, deduz: 22500, shareIbsCbs: 0.46 },
      { ate: 3600000, nominal: 0.147, deduz: 85500, shareIbsCbs: 0.46 },
      { ate: 4800000, nominal: 0.3, deduz: 720000, shareIbsCbs: 0.255 },
    ],
  },
  III: {
    nome: 'III — Serviços',
    faixas: [
      { ate: 180000, nominal: 0.06, deduz: 0, shareIbsCbs: 0.491 },
      { ate: 360000, nominal: 0.112, deduz: 9360, shareIbsCbs: 0.491 },
      { ate: 720000, nominal: 0.135, deduz: 17640, shareIbsCbs: 0.491 },
      { ate: 1800000, nominal: 0.16, deduz: 35640, shareIbsCbs: 0.491 },
      { ate: 3600000, nominal: 0.21, deduz: 125640, shareIbsCbs: 0.491 },
      { ate: 4800000, nominal: 0.33, deduz: 648000, shareIbsCbs: 0.195 },
    ],
  },
  V: {
    nome: 'V — Serviços intelectuais',
    faixas: [
      { ate: 180000, nominal: 0.155, deduz: 0, shareIbsCbs: 0.3115 },
      { ate: 360000, nominal: 0.18, deduz: 4500, shareIbsCbs: 0.3415 },
      { ate: 720000, nominal: 0.195, deduz: 9900, shareIbsCbs: 0.3715 },
      { ate: 1800000, nominal: 0.205, deduz: 17100, shareIbsCbs: 0.4015 },
      { ate: 3600000, nominal: 0.23, deduz: 62100, shareIbsCbs: 0.4065 },
      { ate: 4800000, nominal: 0.305, deduz: 540000, shareIbsCbs: 0.2 },
    ],
  },
};

// Setor do formulário → Anexo. Rural tratado como comércio (Anexo I).
const SETOR_ANEXO = { comercio: 'I', industria: 'II', servico: 'III', rural: 'I' };

// Fator R: serviços com folha/receita < 28% são tributados pelo Anexo V; ≥ 28% pelo III.
export const LIMIAR_FATOR_R = 0.28;

export function anexoDoSetor(setor, fatorR) {
  const s = String(setor || '').toLowerCase();
  if (s === 'servico' && Number.isFinite(fatorR) && fatorR < LIMIAR_FATOR_R) return 'V';
  return SETOR_ANEXO[s] || 'I';
}

// Retorna a carga de IBS/CBS dentro do DAS para um faturamento/setor (+ Fator R p/ serviço).
export function cargaIbsCbsNoSimples(faturamentoAnual, setor, { fatorR = null } = {}) {
  const R = Math.max(0, Number(faturamentoAnual) || 0);
  const chave = anexoDoSetor(setor, fatorR);
  const anexo = ANEXOS[chave];

  let idx = anexo.faixas.findIndex((f) => R <= f.ate);
  if (idx === -1) idx = anexo.faixas.length - 1; // acima do teto → última faixa
  const faixa = anexo.faixas[idx];

  // Alíquota efetiva = (RBT12 × nominal − dedução) / RBT12.
  const aliquotaEfetivaSimples = R > 0 ? Math.max(0, (R * faixa.nominal - faixa.deduz) / R) : faixa.nominal;
  const parcelaSobreReceita = aliquotaEfetivaSimples * faixa.shareIbsCbs;

  return {
    anexo: anexo.nome,
    faixa: idx + 1,
    fatorR: Number.isFinite(fatorR) ? fatorR : null,
    aliquotaEfetivaSimples, // fração
    shareIbsCbsNoDAS: faixa.shareIbsCbs, // fração do DAS que é IBS/CBS
    parcelaSobreReceita, // fração da receita recolhida como IBS/CBS dentro do DAS (cenário puro)
  };
}
