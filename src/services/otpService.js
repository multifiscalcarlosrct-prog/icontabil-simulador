// Geração, envio e validação de código OTP (e-mail no MVP).
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import * as usuarioRepo from '../db/repositories/usuarioRepo.js';
import * as emailService from './emailService.js';

// Gera código de 6 dígitos, grava com expiração e envia por e-mail.
export async function gerarEEnviar(usuarioId, contato) {
  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expiraEm = Date.now() + env.otpTtlMin * 60_000;

  usuarioRepo.salvarOtp({ usuarioId, contato, codigo, expiraEm });
  await enviarEmail(contato, codigo);
  return true;
}

// Confere o código mais recente não usado e ainda válido.
export function validar(usuarioId, codigo) {
  const otp = usuarioRepo.acharOtpAtivo(usuarioId);
  if (!otp) return false;
  if (otp.expira_em < Date.now()) return false;
  if (otp.codigo !== codigo) return false;
  usuarioRepo.marcarOtpUsado(otp.id);
  return true;
}

async function enviarEmail(contato, codigo) {
  // Sem provedor configurado: deixa o código no log do servidor (conveniência em dev).
  if (!env.smtpProvider || !env.smtpApiKey) {
    console.log(`[OTP] código para ${contato}: ${codigo}`);
    return;
  }
  // Provedor configurado: envia o e-mail de verdade (Brevo/Resend).
  const assunto = 'Seu código de acesso — iContábil IA';
  const texto =
    `Seu código de verificação é ${codigo}.\n\n` +
    `Ele expira em ${env.otpTtlMin} minutos. Se você não solicitou, ignore este e-mail.`;
  await emailService.enviar({ para: contato, assunto, html: montarHtml(codigo), texto });
}

// Corpo HTML do e-mail de OTP, na identidade visual iContábil.
function montarHtml(codigo) {
  return `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A">
  <div style="max-width:480px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:#1A1A1A;padding:18px 24px;color:#fff;font-size:18px;font-weight:bold">
      iContábil <span style="color:#22C55E">IA</span>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 12px">Use o código abaixo para liberar o seu relatório:</p>
      <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#16A34A;text-align:center;padding:16px;background:#f4f4f5;border-radius:10px">${codigo}</div>
      <p style="margin:16px 0 0;font-size:13px;color:#52525b">O código expira em ${env.otpTtlMin} minutos. Se você não solicitou, ignore este e-mail.</p>
    </div>
    <div style="padding:14px 24px;font-size:11px;color:#52525b;border-top:1px solid #e4e4e7">
      Simulador de Regime Tributário — Reforma (IBS/CBS) · iContábil IA
    </div>
  </div></body></html>`;
}
