// Acesso à tabela pagamentos (cobranças Pix do plano ilimitado).
import { db } from '../index.js';

export function criar({ usuarioId, provedor, txid, valorCentavos }) {
  const info = db
    .prepare(
      'INSERT INTO pagamentos (usuario_id, provedor, txid, valor_centavos, status, criado_em) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(usuarioId, provedor, txid, valorCentavos, 'pendente', Date.now());
  return acharPorId(info.lastInsertRowid);
}

export function acharPorId(id) {
  return db.prepare('SELECT * FROM pagamentos WHERE id = ?').get(id);
}

export function acharPorTxid(txid) {
  return db.prepare('SELECT * FROM pagamentos WHERE txid = ? ORDER BY id DESC LIMIT 1').get(txid);
}

// Marca como pago (idempotente: só atualiza se ainda estiver pendente).
// Retorna true se ESTA chamada efetivou a confirmação (para disparar o lead só uma vez).
export function marcarPago(txid) {
  const info = db
    .prepare("UPDATE pagamentos SET status = 'pago', pago_em = ? WHERE txid = ? AND status = 'pendente'")
    .run(Date.now(), txid);
  return info.changes > 0;
}
