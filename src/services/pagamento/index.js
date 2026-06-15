// Seleciona o provedor de Pix conforme PIX_PROVIDER. Interface única para os controllers:
//   criarCobranca({ valorCentavos, descricao, email }) -> { txid, qrCode, qrCodeBase64, status }
//   consultarStatus(txid, { criadoEm }) -> 'pendente' | 'pago' | 'expirado'
//   parseWebhook(req) -> { txid } | null
import { env } from '../../config/env.js';
import * as mock from './mock.js';
import * as mercadopago from './mercadopago.js';

const provedores = { mock, mercadopago };

export function getProvedor() {
  const p = provedores[env.pixProvider];
  if (!p) throw new Error(`PIX_PROVIDER inválido: "${env.pixProvider}". Use: ${Object.keys(provedores).join(' | ')}.`);
  return p;
}

export const criarCobranca = (args) => getProvedor().criarCobranca(args);
export const consultarStatus = (txid, ctx) => getProvedor().consultarStatus(txid, ctx);
export const parseWebhook = (req) => getProvedor().parseWebhook(req);
export const nomeProvedor = () => getProvedor().nome;
