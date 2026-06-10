// Acesso à tabela usuarios e otp. Isola SQL dos controllers/services.
import { db } from '../index.js';

export function acharPorContato(contato) {
  return db.prepare('SELECT * FROM usuarios WHERE contato = ?').get(contato);
}

export function acharPorId(id) {
  return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
}

export function acharOuCriarPorContato(contato) {
  const existente = acharPorContato(contato);
  if (existente) return existente;
  const info = db
    .prepare('INSERT INTO usuarios (contato, verificado, plano, criado_em) VALUES (?, 0, ?, ?)')
    .run(contato, 'free', Date.now());
  return acharPorId(info.lastInsertRowid);
}

export function marcarVerificado(id) {
  db.prepare('UPDATE usuarios SET verificado = 1 WHERE id = ?').run(id);
}

// --- OTP ---

export function salvarOtp({ usuarioId, contato, codigo, expiraEm }) {
  db.prepare(
    'INSERT INTO otp (usuario_id, contato, codigo, expira_em, usado) VALUES (?, ?, ?, ?, 0)'
  ).run(usuarioId, contato, codigo, expiraEm);
}

export function acharOtpAtivo(usuarioId) {
  return db
    .prepare('SELECT * FROM otp WHERE usuario_id = ? AND usado = 0 ORDER BY id DESC LIMIT 1')
    .get(usuarioId);
}

export function marcarOtpUsado(otpId) {
  db.prepare('UPDATE otp SET usado = 1 WHERE id = ?').run(otpId);
}
