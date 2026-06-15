// Provedor Pix — Mercado Pago (API de pagamentos).
// Cria um pagamento Pix (QR Code + copia-e-cola) e consulta/recebe a confirmação.
// Doc: POST /v1/payments (payment_method_id: 'pix') → point_of_interaction.transaction_data.
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

export const nome = 'mercadopago';
const BASE = 'https://api.mercadopago.com';

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${env.mpAccessToken}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// approved = pago; pending/in_process/authorized = aguardando; resto = expirado/cancelado.
function mapStatus(s) {
  if (s === 'approved') return 'pago';
  if (['pending', 'in_process', 'authorized'].includes(s)) return 'pendente';
  return 'expirado';
}

export async function criarCobranca({ valorCentavos, descricao, email }) {
  const body = {
    transaction_amount: Number((valorCentavos / 100).toFixed(2)),
    description: descricao,
    payment_method_id: 'pix',
    payer: { email: email || 'comprador@icontabil.shop' },
    notification_url: `${env.appBaseUrl}/api/pagamento/webhook`,
  };
  const resp = await fetch(`${BASE}/v1/payments`, {
    method: 'POST',
    headers: headers({ 'X-Idempotency-Key': crypto.randomUUID() }),
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Mercado Pago ${resp.status}: ${data?.message || JSON.stringify(data).slice(0, 200)}`);
  }
  const td = data?.point_of_interaction?.transaction_data || {};
  return {
    txid: String(data.id),
    qrCode: td.qr_code || '',
    qrCodeBase64: td.qr_code_base64 ? `data:image/png;base64,${td.qr_code_base64}` : null,
    status: mapStatus(data.status),
    descricao,
  };
}

export async function consultarStatus(txid) {
  const resp = await fetch(`${BASE}/v1/payments/${txid}`, { headers: headers() });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Mercado Pago ${resp.status} ao consultar ${txid}`);
  return mapStatus(data.status);
}

// MP notifica com { type:'payment', data:{ id } } (body) ou ?type=payment&data.id=... (query).
// Devolvemos só a referência; a confirmação real vem de consultarStatus (nunca confiar no webhook).
export function parseWebhook(req) {
  const type = req.body?.type || req.query?.type;
  const id = req.body?.data?.id || req.query?.['data.id'] || req.query?.id;
  if ((type === 'payment' || !type) && id) return { txid: String(id) };
  return null;
}
