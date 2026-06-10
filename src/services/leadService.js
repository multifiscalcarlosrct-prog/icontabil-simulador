// Lead-gen (seção 8): joga o lead no fluxo N8N existente.
// Cada CNPJ simulado vira um lead qualificado (regime recomendado + faturamento + contato).
import { env } from '../config/env.js';

// Envia um lead para o webhook do N8N (N8N_WEBHOOK_URL). Sempre carimba origem + data.
// O N8N roteia pelo campo `tipo` ('contato_verificado' | 'simulacao').
export async function enviarLead(payload) {
  const corpo = { origem: 'icontabil-simulador', data: new Date().toISOString(), ...payload };

  if (!env.n8nWebhookUrl) {
    // Sem webhook configurado (ex.: dev): registra no console para inspeção.
    console.log('[LEAD] (N8N não configurado) →', JSON.stringify(corpo));
    return;
  }
  try {
    await fetch(env.n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
  } catch (err) {
    // Lead é "best effort": não derruba o fluxo principal se o N8N falhar.
    console.error('[LEAD] falha ao enviar para o N8N:', err.message);
  }
}
