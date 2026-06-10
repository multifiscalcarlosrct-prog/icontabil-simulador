import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReais } from '../public/js/valor.js';

test('parseReais — formato brasileiro com centavos (o bug que escapou)', () => {
  assert.equal(parseReais('380.000,00'), 380000); // NÃO 38.000.000
  assert.equal(parseReais('380000,00'), 380000);
  assert.equal(parseReais('1.200.000,50'), 1200000.5);
});

test('parseReais — milhar sem centavos', () => {
  assert.equal(parseReais('380.000'), 380000);
  assert.equal(parseReais('1.200.000'), 1200000);
  assert.equal(parseReais('380000'), 380000);
});

test('parseReais — com símbolo/ruído e vazio', () => {
  assert.equal(parseReais('R$ 380.000'), 380000);
  assert.equal(parseReais('  R$ 1.000.000,00 '), 1000000);
  assert.equal(parseReais(''), 0);
  assert.equal(parseReais(null), 0);
  assert.equal(parseReais('abc'), 0);
});

test('parseReais — valor pequeno com decimal', () => {
  assert.equal(parseReais('380,50'), 380.5);
  assert.equal(parseReais('99,99'), 99.99);
});
