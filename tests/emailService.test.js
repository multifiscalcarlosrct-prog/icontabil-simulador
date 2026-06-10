import { test } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import { enviar } from '../src/services/emailService.js';

test('emailService — modo dev (sem provedor) não lança e sinaliza modo dev', async () => {
  // Força o modo dev independentemente do .env (evita enviar e-mail real durante os testes).
  const orig = { provider: env.smtpProvider, key: env.smtpApiKey };
  env.smtpProvider = '';
  env.smtpApiKey = '';
  try {
    const r = await enviar({ para: 'teste@exemplo.com', assunto: 'oi', texto: 'corpo' });
    assert.equal(r.entregue, false);
    assert.equal(r.modo, 'dev');
  } finally {
    env.smtpProvider = orig.provider;
    env.smtpApiKey = orig.key;
  }
});
