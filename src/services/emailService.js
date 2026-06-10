// Envio de e-mail transacional. Suporta Brevo e Resend via API HTTP (sem libs de SMTP).
// Provedor e chave vêm do .env (SMTP_PROVIDER / SMTP_API_KEY). Sem chave → modo dev (console).
import { env } from '../config/env.js';

// Envia um e-mail. Retorna { entregue, modo }. Não lança em modo dev.
export async function enviar({ para, assunto, html, texto }) {
  const provider = (env.smtpProvider || '').toLowerCase();

  if (!provider || !env.smtpApiKey) {
    // Dev / não configurado: registra no console em vez de enviar.
    console.log(`[EMAIL:dev] para=${para} · assunto="${assunto}"\n${texto || ''}`);
    return { entregue: false, modo: 'dev' };
  }
  if (provider === 'resend') return enviarResend({ para, assunto, html, texto });
  if (provider === 'brevo') return enviarBrevo({ para, assunto, html, texto });
  throw new Error(`SMTP_PROVIDER desconhecido: "${provider}" (use 'brevo' ou 'resend').`);
}

// https://resend.com — POST /emails com Bearer token.
async function enviarResend({ para, assunto, html, texto }) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.smtpApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.otpFrom, to: [para], subject: assunto, html, text: texto }),
  });
  if (!resp.ok) throw new Error(`Resend ${resp.status}: ${await resp.text()}`);
  return { entregue: true, modo: 'resend' };
}

// https://brevo.com — POST /v3/smtp/email com header api-key.
async function enviarBrevo({ para, assunto, html, texto }) {
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.smtpApiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: env.otpFrom, name: 'iContábil IA' },
      to: [{ email: para }],
      subject: assunto,
      htmlContent: html,
      textContent: texto,
    }),
  });
  if (!resp.ok) throw new Error(`Brevo ${resp.status}: ${await resp.text()}`);
  return { entregue: true, modo: 'brevo' };
}
