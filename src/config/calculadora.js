// Integração com a Calculadora oficial IBS/CBS (Reforma Tributária) — Regime Geral.
//
// Contrato VALIDADO AO VIVO contra o piloto oficial da RFB (2026-06):
//   POST {base}/calculadora/regime-geral
//   body: { id, versao, dataHoraEmissao:'yyyy-MM-ddTHH:mm:ss-03:00', uf, municipio, itens:[...] }
//   resposta: total.tribCalc.IBSCBSTot.{ gIBS.vIBS, gCBS.vCBS, vBCIBSCBS }
//
// Base (CALCULADORA_URL):
//   - Piloto online: https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api
//   - Offline (jar): http://localhost:8080/api

export const ROTA_REGIME_GERAL = '/calculadora/regime-geral';

// Operação REPRESENTATIVA para estimar a ALÍQUOTA EFETIVA PADRÃO (tributação integral) do
// IBS/CBS no regime regular. NÃO é uma operação fiscal real — é uma sonda de R$ 10.000.
export const operacaoRepresentativa = {
  id: 'icontabil-ref',
  versao: '1.0.0',
  // Data de referência = REGIME PLENO. A transição (2026-2032) tem alíquotas reduzidas
  // (2026 é ano-teste, ~1%); a decisão puro vs. híbrido é sobre o estado pleno (~27%).
  // O piloto tem regras até 2033; usamos uma data segura dentro do regime cheio.
  dataReferencia: '2033-07-01',
  cst: '000', // "Tributação integral" — validado em /dados-abertos/situacoes-tributarias/cbs-ibs
  cClassTrib: '000001', // "Tributada integralmente, alíquota Padrão" — validado em /classificacoes-tributarias
  // NCM neutro: "outras obras de plástico". Mercadoria de tributação padrão, SEM redução e
  // SEM Imposto Seletivo (evita o 422 de NCMs como bebidas/cigarros). Dá a alíquota cheia.
  ncm: '39269090',
  unidade: 'UN',
  quantidade: 1,
  ufPadrao: 'BA',
  municipioIBGEPadrao: 2903201, // Barreiras/BA (sede iContábil)
};
