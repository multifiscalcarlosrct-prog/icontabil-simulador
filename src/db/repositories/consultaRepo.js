// Acesso à tabela consultas (cache por CNPJ + base da regra de cota).
import { db } from '../index.js';

export function acharPorId(id) {
  return db.prepare('SELECT * FROM consultas WHERE id = ?').get(id);
}

// Cache por CNPJ: a consulta mais recente desta conta para este CNPJ.
export function acharPorUsuarioECnpj(usuarioId, cnpj) {
  return db
    .prepare(
      'SELECT * FROM consultas WHERE usuario_id = ? AND cnpj = ? ORDER BY id DESC LIMIT 1'
    )
    .get(usuarioId, cnpj);
}

export function gravar({ usuarioId, cnpj, payload }) {
  const info = db
    .prepare('INSERT INTO consultas (usuario_id, cnpj, criado_em, payload_resultado) VALUES (?, ?, ?, ?)')
    .run(usuarioId, cnpj, Date.now(), JSON.stringify(payload));
  return info.lastInsertRowid;
}

// Atualiza o resultado de uma consulta existente (re-simulação do mesmo CNPJ).
export function atualizar({ id, payload }) {
  db.prepare('UPDATE consultas SET criado_em = ?, payload_resultado = ? WHERE id = ?')
    .run(Date.now(), JSON.stringify(payload), id);
}

// Nº de CNPJs distintos simulados pela conta — base do cálculo de crédito.
export function contarCnpjsDistintos(usuarioId) {
  const row = db
    .prepare('SELECT COUNT(DISTINCT cnpj) AS n FROM consultas WHERE usuario_id = ?')
    .get(usuarioId);
  return row?.n ?? 0;
}
