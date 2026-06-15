// Provedor Pix SIMULADO — para desenvolvimento/testes sem provedor real.
// Gera uma cobrança fake e auto-confirma após MOCK_PIX_DELAY_MS (simula o usuário pagando).
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

export const nome = 'mock';

export async function criarCobranca({ valorCentavos, descricao }) {
  const txid = `mock-${crypto.randomUUID()}`;
  const valor = (valorCentavos / 100).toFixed(2);
  // "copia e cola" fictício, só para exibição/cópia na tela de teste.
  const qrCode = `00020126MOCK-PIX-${txid}520400005303986540${valor}5802BR5913iContabil IA6009SAO PAULO62070503***6304MOCK`;
  return {
    txid,
    qrCode,
    qrCodeBase64: null, // sem imagem real no mock; o front mostra um placeholder
    status: 'pendente',
    descricao,
  };
}

// Auto-confirma depois do atraso configurado, a partir da criação da cobrança.
export async function consultarStatus(_txid, { criadoEm } = {}) {
  if (criadoEm && Date.now() - criadoEm >= env.mockPixDelayMs) return 'pago';
  return 'pendente';
}

// O mock não recebe webhook real; mantido por simetria de interface.
export function parseWebhook(req) {
  const txid = req.body?.txid || req.query?.txid;
  return txid ? { txid: String(txid) } : null;
}
