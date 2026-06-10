import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparar } from '../src/services/motorDecisao.js';

// Sem CALCULADORA_URL, a alíquota cai no mock/referência (~26,5%) — determinístico.
const ENTRADA = { faturamento: 1000000, pesoInsumos: 30, setor: 'comercio' };

test('regra de ouro: predomínio PJ → híbrido (forte)', async () => {
  const r = await comparar({ ...ENTRADA, pctPJ: 80 });
  assert.equal(r.recomendacao, 'hibrido');
  assert.equal(r.forca, 'forte');
  assert.equal(r.entrada.pctPJ, 0.8);
  assert.ok(Math.abs(r.entrada.pctConsumidorFinal - 0.2) < 1e-9);
});

test('regra de ouro: predomínio consumidor final → puro (forte)', async () => {
  const r = await comparar({ ...ENTRADA, pctPJ: 20 });
  assert.equal(r.recomendacao, 'puro');
  assert.equal(r.forca, 'forte');
});

test('zona cinzenta: desempata por insumos (força fraca)', async () => {
  const alto = await comparar({ faturamento: 1000000, pctPJ: 50, pesoInsumos: 40, setor: 'comercio' });
  assert.equal(alto.recomendacao, 'hibrido');
  assert.equal(alto.forca, 'fraca');

  const baixo = await comparar({ faturamento: 1000000, pctPJ: 50, pesoInsumos: 10, setor: 'comercio' });
  assert.equal(baixo.recomendacao, 'puro');
  assert.equal(baixo.forca, 'fraca');
});

test('aceita percentuais em 0–100 e converte para fração', async () => {
  const r = await comparar({ ...ENTRADA, pctPJ: 60 });
  assert.equal(r.entrada.pctPJ, 0.6);
  assert.equal(r.entrada.pesoInsumos, 0.3);
});

test('crédito ao cliente PJ usa a alíquota do regime regular', async () => {
  const r = await comparar({ ...ENTRADA, pctPJ: 80 });
  const aliq = r.premissas.aliquotaRegimeRegular;
  const esperado = Math.round(1000000 * 0.8 * aliq);
  assert.equal(r.cenarios.simplesHibrido.creditoGeradoAoClientePJ, esperado);
});

test('Fator R baixo move serviço para o Anexo V e muda a carga do puro', async () => {
  const semFR = await comparar({ faturamento: 1000000, pctPJ: 50, pesoInsumos: 15, setor: 'servico' });
  const comFR = await comparar({ faturamento: 1000000, pctPJ: 50, pesoInsumos: 15, setor: 'servico', folhaPagamento: 150000 });
  assert.ok(semFR.premissas.simples.anexo.startsWith('III'));
  assert.ok(comFR.premissas.simples.anexo.startsWith('V'));
  assert.ok(Math.abs(comFR.entrada.fatorR - 0.15) < 1e-9);
  assert.ok(comFR.cenarios.simplesPuro.ibsCbsAnualEstimado > semFR.cenarios.simplesPuro.ibsCbsAnualEstimado);
});
