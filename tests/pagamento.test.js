// Testes do provedor de Pix: mock (cobrança + auto-confirmação) e parsing de webhook do Mercado Pago.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mock from '../src/services/pagamento/mock.js';
import * as mp from '../src/services/pagamento/mercadopago.js';

test('mock.criarCobranca devolve txid, copia-e-cola e status pendente', async () => {
  const c = await mock.criarCobranca({ valorCentavos: 999, descricao: 'Plano' });
  assert.ok(c.txid.startsWith('mock-'));
  assert.ok(c.qrCode.length > 0);
  assert.equal(c.qrCodeBase64, null);
  assert.equal(c.status, 'pendente');
});

test('mock.consultarStatus: pendente antes do atraso, pago depois', async () => {
  assert.equal(await mock.consultarStatus('x', { criadoEm: Date.now() }), 'pendente');
  // criadoEm bem no passado (10s) ultrapassa o atraso padrão do mock (5s)
  assert.equal(await mock.consultarStatus('x', { criadoEm: Date.now() - 10_000 }), 'pago');
});

test('mp.parseWebhook entende corpo e query, ignora ruído', () => {
  assert.deepEqual(mp.parseWebhook({ body: { type: 'payment', data: { id: '123' } }, query: {} }), { txid: '123' });
  assert.deepEqual(mp.parseWebhook({ body: {}, query: { type: 'payment', 'data.id': '456' } }), { txid: '456' });
  assert.equal(mp.parseWebhook({ body: { type: 'merchant_order' }, query: {} }), null);
  assert.equal(mp.parseWebhook({ body: {}, query: {} }), null);
});
