import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargaIbsCbsNoSimples, anexoDoSetor, LIMIAR_FATOR_R } from '../src/config/simplesNacional.js';

const arred = (n, c = 4) => Number(n.toFixed(c));

test('setor → anexo (sem Fator R)', () => {
  assert.equal(anexoDoSetor('comercio'), 'I');
  assert.equal(anexoDoSetor('industria'), 'II');
  assert.equal(anexoDoSetor('servico'), 'III');
  assert.equal(anexoDoSetor('rural'), 'I');
  assert.equal(anexoDoSetor('desconhecido'), 'I'); // fallback
});

test('Fator R roteia serviço entre Anexo III e V', () => {
  assert.equal(LIMIAR_FATOR_R, 0.28);
  assert.equal(anexoDoSetor('servico', 0.35), 'III'); // ≥ 28%
  assert.equal(anexoDoSetor('servico', 0.28), 'III'); // limite exato fica no III
  assert.equal(anexoDoSetor('servico', 0.2), 'V'); // < 28%
  assert.equal(anexoDoSetor('comercio', 0.1), 'I'); // Fator R não afeta comércio
});

test('Comércio: faixa e parcela IBS/CBS sobre a receita', () => {
  // 1ª faixa (≤180k): efetiva 4% × fatia 49,5% = 1,98%.
  let r = cargaIbsCbsNoSimples(120000, 'comercio');
  assert.equal(r.faixa, 1);
  assert.equal(arred(r.aliquotaEfetivaSimples), 0.04);
  assert.equal(arred(r.parcelaSobreReceita), 0.0198);

  // 380k → 3ª faixa: efetiva (380000×0,095−13860)/380000 = 5,8526%.
  r = cargaIbsCbsNoSimples(380000, 'comercio');
  assert.equal(r.faixa, 3);
  assert.equal(arred(r.aliquotaEfetivaSimples), 0.0585);
  assert.equal(arred(r.parcelaSobreReceita), 0.029);
});

test('Serviço: Fator R baixo → Anexo V tem carga maior que o III', () => {
  const semFR = cargaIbsCbsNoSimples(1000000, 'servico'); // Anexo III
  const comFR = cargaIbsCbsNoSimples(1000000, 'servico', { fatorR: 0.2 }); // Anexo V
  assert.ok(semFR.anexo.startsWith('III'));
  assert.ok(comFR.anexo.startsWith('V'));
  assert.equal(comFR.fatorR, 0.2);
  assert.ok(comFR.parcelaSobreReceita > semFR.parcelaSobreReceita);
});

test('Acima do teto cai na 6ª faixa (não quebra)', () => {
  const r = cargaIbsCbsNoSimples(9000000, 'comercio');
  assert.equal(r.faixa, 6);
  assert.ok(r.parcelaSobreReceita > 0);
});
