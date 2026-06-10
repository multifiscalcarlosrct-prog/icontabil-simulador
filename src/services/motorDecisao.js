// NÚCLEO do produto: compara Simples puro vs. híbrido e recomenda (seção 4 do CLAUDE.md).
//
// Modelo SIMPLIFICADO e honesto (ver seção 3): as alíquotas de 2027+ são provisórias, então
// os valores anuais são ESTIMATIVAS indicativas. A recomendação qualitativa (puro vs. híbrido)
// é a saída robusta porque depende mais do PERFIL DE CLIENTE do que da alíquota exata.
//
// Regra de ouro (seção 4):
//   - Cliente majoritariamente PJ (aproveita crédito) → híbrido tende a vencer
//     (gera crédito ao cliente + a empresa se credita dos insumos).
//   - Cliente majoritariamente consumidor final → puro tende a vencer
//     (cliente não usa crédito; híbrido só adiciona carga/complexidade).

import { tributos } from '../config/tributos.js';
import * as calculadoraService from './calculadoraService.js';
import { cargaIbsCbsNoSimples } from '../config/simplesNacional.js';

// Aceita 0–1 ou 0–100; devolve fração 0–1 com clamp.
function fracao(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const f = n > 1 ? n / 100 : n;
  return Math.min(1, Math.max(0, f));
}

const brl = (v) => Math.round(Number(v) || 0);

export async function comparar({ cnpj, faturamento, pctPJ, pesoInsumos, setor, folhaPagamento, uf, municipio }) {
  const R = Math.max(0, Number(faturamento) || 0); // faturamento anual
  const pPJ = fracao(pctPJ); // share de vendas a PJ que aproveita crédito
  const pCF = 1 - pPJ; // consumidor final / PF
  const ins = fracao(pesoInsumos); // peso de insumos/mercadorias creditáveis

  // Fator R (só serviço): folha 12m ÷ receita 12m. Define Anexo III (≥28%) vs V (<28%).
  const folha = Math.max(0, Number(folhaPagamento) || 0);
  const fatorR = String(setor).toLowerCase() === 'servico' && R > 0 && folha > 0 ? folha / R : null;

  // Alíquota cheia do regime regular: da Calculadora oficial (fallback = referência).
  let aliq = tributos.aliquotaReferencia;
  let fonteAliq = 'referencia';
  try {
    const ef = await calculadoraService.aliquotaEfetiva({ uf, setor });
    if (ef?.aliquota > 0) {
      aliq = ef.aliquota;
      fonteAliq = ef.fonte;
    }
  } catch {
    /* mantém a alíquota de referência */
  }

  // Carga de IBS/CBS dentro do DAS (cenário puro) calculada por Anexo + faixa (LC 123).
  const simples = cargaIbsCbsNoSimples(R, setor, { fatorR });
  const aliqDAS = simples.parcelaSobreReceita;

  // --- Cenário PURO: IBS/CBS dentro do DAS, sem créditos ---
  const puroCarga = R * aliqDAS;
  const puroCreditoCliente = 0;

  // --- Cenário HÍBRIDO: recolhe IBS/CBS "por fora", com créditos ---
  const hibDebito = R * aliq; // sobre as vendas
  const hibCreditoInsumos = R * ins * aliq; // a empresa se credita dos insumos
  const hibLiquido = Math.max(0, hibDebito - hibCreditoInsumos); // recolhimento líquido
  const hibCreditoClientePJ = R * pPJ * aliq; // crédito que FLUI ao cliente PJ (vantagem B2B)

  // --- Decisão (regra de ouro + desempate por insumos na zona cinzenta) ---
  let recomendacao;
  let forca; // 'forte' | 'fraca'
  let justificativa;

  if (pPJ >= tributos.limiarPjAlto) {
    recomendacao = 'hibrido';
    forca = 'forte';
    justificativa =
      'Predomínio de clientes PJ: o híbrido gera crédito de IBS/CBS para o cliente ' +
      '(mantém a empresa competitiva no B2B) e ainda permite creditar-se dos insumos.';
  } else if (pPJ <= tributos.limiarPjBaixo) {
    recomendacao = 'puro';
    forca = 'forte';
    justificativa =
      'Predomínio de consumidor final: o cliente não aproveita crédito, então o híbrido ' +
      'só adicionaria carga e complexidade. O puro tende a ser mais simples e econômico.';
  } else {
    // Zona cinzenta: desempata pelo peso de insumos creditáveis.
    recomendacao = ins >= tributos.limiarInsumoParaHibrido ? 'hibrido' : 'puro';
    forca = 'fraca';
    justificativa =
      'Perfil intermediário de clientes (parte PJ, parte consumidor final). ' +
      (recomendacao === 'hibrido'
        ? 'O peso relevante de insumos creditáveis pende para o híbrido, '
        : 'O baixo peso de insumos creditáveis pende para o puro, ') +
      'mas a margem é estreita — recomenda-se análise individualizada.';
  }

  const pPJtxt = `${Math.round(pPJ * 100)}%`;
  const pCFtxt = `${Math.round(pCF * 100)}%`;

  // Explicação em linguagem simples, ligando os números à recomendação (evita a confusão de
  // "o híbrido mostra imposto maior, então por que é recomendado?").
  const comoInterpretar = [
    'Os valores em destaque são estimativas do IBS/CBS por ano em cada regime, com base no que você informou.',
    recomendacao === 'hibrido'
      ? `O Híbrido aparece com um imposto maior, mas ${pPJtxt} das suas vendas são para empresas: ` +
        'nesse caso o IBS/CBS vira crédito para o seu cliente e é recuperado ao longo da cadeia — ' +
        'além de você recuperar o imposto das suas compras. Na prática, isso te mantém competitivo ' +
        'no mercado entre empresas (B2B). No Puro você pagaria menos imposto, porém não geraria esse ' +
        'crédito, o que pode te tornar um fornecedor menos atrativo para outras empresas.'
      : `Como ${pCFtxt} das suas vendas são para o consumidor final (que não aproveita crédito), ` +
        'gerar crédito pelo Híbrido traria pouca vantagem e mais complexidade. O Puro tende a ser ' +
        'mais simples e econômico para o seu perfil.',
    'Esta é uma orientação preliminar. A escolha definitiva deve ser confirmada em uma análise ' +
      'individualizada, que considera todos os detalhes da sua operação.',
  ];

  return {
    _mock: false,
    entrada: { cnpj, faturamentoAnual: R, pctPJ: pPJ, pctConsumidorFinal: pCF, pesoInsumos: ins, setor, folhaPagamento: folha, fatorR, uf, municipio },
    premissas: {
      aliquotaRegimeRegular: aliq,
      fonteAliquota: fonteAliq, // 'calculadora' | 'mock' | 'referencia'
      parcelaIbsCbsNoDAS: aliqDAS, // fração da receita (cenário puro)
      simples: {
        anexo: simples.anexo,
        faixa: simples.faixa,
        fatorR: simples.fatorR,
        aliquotaEfetiva: simples.aliquotaEfetivaSimples,
        shareIbsCbsNoDAS: simples.shareIbsCbsNoDAS,
      },
      observacao: 'Alíquotas provisórias (2027+). Valores anuais são estimativas indicativas.',
    },
    cenarios: {
      simplesPuro: {
        ibsCbsAnualEstimado: brl(puroCarga),
        creditoGeradoAoCliente: puroCreditoCliente,
        rotuloValor: 'IBS/CBS por ano, dentro do DAS (estimativa)',
        observacao: 'Você paga tudo em uma guia só (DAS). Esse imposto NÃO vira crédito para o seu cliente.',
      },
      simplesHibrido: {
        debitoAnualEstimado: brl(hibDebito),
        creditoInsumosAnualEstimado: brl(hibCreditoInsumos),
        ibsCbsLiquidoAnualEstimado: brl(hibLiquido),
        creditoGeradoAoClientePJ: brl(hibCreditoClientePJ),
        rotuloValor: 'IBS/CBS líquido por ano, já com créditos (estimativa)',
        observacao: 'Recolhido por fora, pelo regime regular. Gera crédito para o cliente empresa e recupera o imposto das suas compras.',
      },
    },
    recomendacao, // 'puro' | 'hibrido'
    forca, // confiança qualitativa da recomendação
    justificativa,
    comoInterpretar, // explicação em linguagem simples (web + PDF)
    disclaimer:
      'Simulação/orientação preliminar com base nos dados informados; alíquotas da Reforma ' +
      'ainda provisórias. Não substitui análise individualizada por contador habilitado.',
  };
}
