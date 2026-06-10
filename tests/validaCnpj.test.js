import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validaCnpj } from '../src/utils/validaCnpj.js';

test('validaCnpj — CNPJs válidos (com e sem máscara)', () => {
  assert.equal(validaCnpj('11222333000181'), true);
  assert.equal(validaCnpj('11.222.333/0001-81'), true);
  assert.equal(validaCnpj('00000000000191'), true); // Banco do Brasil
});

test('validaCnpj — inválidos', () => {
  assert.equal(validaCnpj('11222333000180'), false); // DV errado
  assert.equal(validaCnpj('11111111111111'), false); // sequência repetida
  assert.equal(validaCnpj('123'), false); // tamanho errado
  assert.equal(validaCnpj(''), false);
  assert.equal(validaCnpj(null), false);
});
