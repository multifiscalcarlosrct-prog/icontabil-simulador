// Controller de autenticação por OTP.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { normalizaEmail } from '../utils/normalizaEmail.js';
import { normalizaWhatsapp } from '../utils/normalizaWhatsapp.js';
import * as otpService from '../services/otpService.js';
import * as usuarioRepo from '../db/repositories/usuarioRepo.js';

// POST /api/auth/solicitar-otp
// Cria/acha usuário não verificado, grava o WhatsApp e envia o código.
// Não revela se o contato já existia.
export async function solicitarOtp(req, res, next) {
  try {
    const contato = normalizaEmail(req.body?.contato || '');
    if (!contato) return res.status(400).json({ erro: 'Informe um e-mail válido.' });

    // WhatsApp obrigatório (decisão de funil): é a base da nutrição de leads.
    const whatsapp = normalizaWhatsapp(req.body?.whatsapp || '');
    if (!whatsapp) return res.status(400).json({ erro: 'Informe um WhatsApp válido, com DDD.' });

    const usuario = usuarioRepo.acharOuCriarPorContato(contato);
    usuarioRepo.salvarWhatsapp(usuario.id, whatsapp);
    await otpService.gerarEEnviar(usuario.id, contato);

    // Resposta neutra de propósito (não vaza existência de conta).
    res.json({ ok: true, mensagem: 'Se o contato for válido, enviamos um código.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verificar-otp
// Valida o código, marca verificado e abre sessão.
// NÃO dispara lead aqui de propósito: o lead de 'contato_verificado' não tem os dados da
// simulação (nome/recomendação/% PJ) e caía no fallback de Comércio da nutrição, gerando
// mensagem de WhatsApp com "undefined". O lead que nutre é o de 'simulacao' (logo em seguida).
export async function verificarOtp(req, res, next) {
  try {
    const contato = normalizaEmail(req.body?.contato || '');
    const codigo = String(req.body?.codigo || '').trim();
    if (!contato || !codigo) return res.status(400).json({ erro: 'Contato e código são obrigatórios.' });

    const usuario = usuarioRepo.acharPorContato(contato);
    if (!usuario) return res.status(400).json({ erro: 'Código inválido ou expirado.' });

    const ok = otpService.validar(usuario.id, codigo);
    if (!ok) return res.status(400).json({ erro: 'Código inválido ou expirado.' });

    usuarioRepo.marcarVerificado(usuario.id);

    const token = jwt.sign({ uid: usuario.id, contato }, env.jwtSecret, { expiresIn: '30d' });
    res.json({ ok: true, token });
  } catch (err) {
    next(err);
  }
}
