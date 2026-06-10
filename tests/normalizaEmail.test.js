import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizaEmail } from '../src/utils/normalizaEmail.js';

test('normalizaEmail — Gmail: remove pontos e +tag (anti multi-conta)', () => {
  assert.equal(normalizaEmail('Foo.Bar+promo@Gmail.com'), 'foobar@gmail.com');
  assert.equal(normalizaEmail('a.b.c@googlemail.com'), 'abc@gmail.com');
});

test('normalizaEmail — outros provedores: só minúsculas e +tag', () => {
  assert.equal(normalizaEmail('User+x@Outlook.com'), 'user@outlook.com');
  assert.equal(normalizaEmail('Nome.Sobrenome@empresa.com.br'), 'nome.sobrenome@empresa.com.br');
});

test('normalizaEmail — inválidos viram string vazia', () => {
  assert.equal(normalizaEmail('semarroba'), '');
  assert.equal(normalizaEmail('@dominio.com'), '');
  assert.equal(normalizaEmail(''), '');
  assert.equal(normalizaEmail(null), '');
});
