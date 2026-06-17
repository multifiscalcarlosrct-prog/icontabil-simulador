// Protege o painel de admin. Token simples por header (X-Admin-Token) ou ?token=.
// Comparação em tempo constante para não vazar o token por timing.
import crypto from 'node:crypto';
import { env } from '../config/env.js';

function tokensIguais(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function exigeAdmin(req, res, next) {
  if (!env.adminToken) return res.status(503).json({ erro: 'Painel indisponível (ADMIN_TOKEN não configurado).' });
  const enviado = req.get('X-Admin-Token') || req.query.token || '';
  if (!enviado || !tokensIguais(enviado, env.adminToken)) {
    return res.status(401).json({ erro: 'Acesso negado.' });
  }
  next();
}
