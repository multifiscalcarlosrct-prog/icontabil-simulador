// Regra da Opção A: detectar não-optante do Simples de forma robusta (BrasilAPI às vezes
// devolve opcao_pelo_simples = null; o porte "DEMAIS" garante que não é ME/EPP → não-Simples).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ehNaoOptanteSimples } from '../src/services/cnpjService.js';

test('ehNaoOptanteSimples — optante explícito não bloqueia', () => {
  assert.equal(ehNaoOptanteSimples(true, 'DEMAIS'), false); // optante confirmado vence o porte
  assert.equal(ehNaoOptanteSimples(true, null), false);
});

test('ehNaoOptanteSimples — não-optante explícito bloqueia', () => {
  assert.equal(ehNaoOptanteSimples(false, 'MICRO EMPRESA'), true);
  assert.equal(ehNaoOptanteSimples(false, null), true);
});

test('ehNaoOptanteSimples — null + porte DEMAIS bloqueia (não é ME/EPP)', () => {
  assert.equal(ehNaoOptanteSimples(null, 'DEMAIS'), true);
  assert.equal(ehNaoOptanteSimples(null, 'demais'), true); // case-insensitive
});

test('ehNaoOptanteSimples — null + ME/EPP/desconhecido NÃO bloqueia', () => {
  assert.equal(ehNaoOptanteSimples(null, 'MICRO EMPRESA'), false);
  assert.equal(ehNaoOptanteSimples(null, 'EMPRESA DE PEQUENO PORTE'), false);
  assert.equal(ehNaoOptanteSimples(null, null), false);
});
