-- Modelo de dados enxuto (seção 6 do CLAUDE.md).

CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  contato     TEXT NOT NULL UNIQUE,           -- e-mail/celular já normalizado
  whatsapp    TEXT,                           -- 55 + DDD + número (normalizado); base da nutrição
  verificado  INTEGER NOT NULL DEFAULT 0,     -- 0/1
  plano       TEXT NOT NULL DEFAULT 'free',   -- free | pago
  criado_em   INTEGER NOT NULL                -- epoch ms
);

CREATE TABLE IF NOT EXISTS consultas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id        INTEGER NOT NULL REFERENCES usuarios(id),
  cnpj              TEXT NOT NULL,
  criado_em         INTEGER NOT NULL,
  payload_resultado TEXT NOT NULL             -- JSON do comparativo (cache por CNPJ)
);

-- Para a regra de cota (CNPJs distintos por conta) e o cache.
CREATE INDEX IF NOT EXISTS idx_consultas_usuario_cnpj ON consultas(usuario_id, cnpj);

CREATE TABLE IF NOT EXISTS otp (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  contato    TEXT NOT NULL,
  codigo     TEXT NOT NULL,
  expira_em  INTEGER NOT NULL,                -- epoch ms
  usado      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_otp_usuario ON otp(usuario_id, usado);
