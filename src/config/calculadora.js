// Integração com a Calculadora oficial IBS/CBS (Reforma Tributária) — Regime Geral.
//
// Contrato VERIFICADO no código-fonte da lib CalculadoraRTC (github.com/andre-djsystem)
// e na documentação oficial (piloto-cbs.tributos.gov.br):
//   POST {base}/calculadora/regime-geral   body: IOperacaoInput
//   resposta: { objetos:[...], total: { tribCalc: { ISTot:{vIS}, IBSCBSTot:{ vBCIBSCBS,
//              gIBS:{ gIBSUF:{vIBSUF}, gIBSMun:{vIBSMun}, vIBS }, gCBS:{ vCBS } } } } }
//
// Bases conhecidas (definir em CALCULADORA_URL):
//   - Offline (jar local):  http://localhost:8080/api
//   - Piloto online:        https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api

export const ROTA_REGIME_GERAL = '/calculadora/regime-geral';

// Operação REPRESENTATIVA usada apenas para ESTIMAR a alíquota efetiva do regime regular
// (não é uma operação fiscal real). A Calculadora é por-operação; aqui mandamos uma operação
// "padrão" de valor conhecido e derivamos a alíquota = (vIBS + vCBS) / valor.
//
// ⚠️ Os códigos abaixo são PLACEHOLDERS e PRECISAM ser validados contra as tabelas de
//    dados-abertos da própria Calculadora (situações-tributárias e classificações por
//    CBS/IBS) e a realidade da empresa. Enquanto não validados, o serviço cai no fallback.
export const operacaoRepresentativa = {
  cst: '000', // tributação integral — confirmar em /dados-abertos/situacoes-tributarias/cbs-ibs
  cClassTrib: '000001', // classificação padrão — confirmar em /dados-abertos/classificacoes-tributarias/cbs-ibs
  unidade: 'UN',
  quantidade: 1,
  // Mercadoria usa NCM; serviço usa NBS. Códigos genéricos por setor (a validar).
  porSetor: {
    comercio: { tipo: 'ncm', codigo: '22021000' },
    industria: { tipo: 'ncm', codigo: '22021000' },
    servico: { tipo: 'nbs', codigo: '101011900' },
    rural: { tipo: 'ncm', codigo: '10063021' },
    _padrao: { tipo: 'ncm', codigo: '22021000' },
  },
  ufPadrao: 'BA',
  municipioIBGEPadrao: 2903201, // Barreiras/BA (sede iContábil) — usado quando não há IBGE do cadastro
};
