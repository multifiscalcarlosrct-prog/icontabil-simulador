import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enviar } from '../src/services/emailService.js';

test('emailService — modo dev (sem provedor) não lança e sinaliza modo dev', async () => {
  const r = await enviar({ para: 'teste@exemplo.com', assunto: 'oi', texto: 'corpo' });
  assert.equal(r.entregue, false);
  assert.equal(r.modo, 'dev');
});
