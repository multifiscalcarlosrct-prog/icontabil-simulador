// Bloqueia o acesso se a conta não estiver verificada (seção 6).
// Lê o token de sessão (Bearer) emitido após o OTP e popula req.usuario.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as usuarioRepo from '../db/repositories/usuarioRepo.js';

export function exigeVerificado(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login (verifique seu contato por OTP).' });

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
  }

  const usuario = usuarioRepo.acharPorId(payload.uid);
  if (!usuario || !usuario.verificado) {
    return res.status(403).json({ erro: 'Conta não verificada.' });
  }

  req.usuario = usuario;
  next();
}
