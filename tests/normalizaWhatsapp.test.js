import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizaWhatsapp } from '../src/utils/normalizaWhatsapp.js';

test('normalizaWhatsapp — celular e fixo com DDD ganham o 55', () => {
  assert.equal(normalizaWhatsapp('(77) 99868-5213'), '5577998685213'); // celular 11 dígitos
  assert.equal(normalizaWhatsapp('77 3611-0000'), '557736110000'); // fixo 10 dígitos
  assert.equal(normalizaWhatsapp('77998685213'), '5577998685213');
});

test('normalizaWhatsapp — já com 55 na frente mantém', () => {
  assert.equal(normalizaWhatsapp('5577998685213'), '5577998685213'); // 13 dígitos
  assert.equal(normalizaWhatsapp('+55 (77) 3611-0000'), '557736110000'); // 12 dígitos
});

test('normalizaWhatsapp — DDD 55 (RS) não é confundido com código do país', () => {
  assert.equal(normalizaWhatsapp('(55) 99999-8888'), '5555999998888');
});

test('normalizaWhatsapp — inválidos viram vazio', () => {
  assert.equal(normalizaWhatsapp('999'), '');
  assert.equal(normalizaWhatsapp(''), '');
  assert.equal(normalizaWhatsapp(null), '');
  assert.equal(normalizaWhatsapp('123456789012345'), ''); // longo demais
});
