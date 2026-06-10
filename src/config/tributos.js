// Parâmetros tributários da Reforma (IBS/CBS) — PROVISÓRIOS.
//
// >>> LEIA: seção 3 do CLAUDE.md <<<
// As alíquotas de 2027+ ainda não estão definitivas. Os valores aqui são ESTIMATIVAS,
// centralizadas de propósito num único arquivo para o contador responsável (CRC) calibrar
// sem mexer no motor. A saída numérica é indicativa; a recomendação QUALITATIVA é a robusta.

export const tributos = {
  // Alíquota de referência projetada para o regime regular (~26,5% — seção 3).
  // Usada como fallback quando a Calculadora oficial não está disponível.
  aliquotaReferencia: 0.265,

  // Alíquotas de teste vigentes em 2026 (seção 3) — só para exibir no disclaimer.
  aliquotasTeste2026: { cbs: 0.009, ibs: 0.001 },

  // A carga de IBS/CBS embutida no DAS do Simples "puro" NÃO é mais um placeholder fixo:
  // é calculada por Anexo + faixa em src/config/simplesNacional.js (tabelas oficiais LC 123).

  // Limiares da "regra de ouro" (seção 4), em fração de vendas a PJ que aproveita crédito.
  limiarPjAlto: 0.6, // ≥ → híbrido tende a vencer (forte)
  limiarPjBaixo: 0.4, // ≤ → puro tende a vencer (forte)

  // Na zona cinzenta (entre os limiares), desempata pelo peso de insumos creditáveis.
  limiarInsumoParaHibrido: 0.35,
};
