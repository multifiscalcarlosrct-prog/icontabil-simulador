// Conexão SQLite (MVP) → trocar para Postgres na escala, mantendo a API dos repositories.
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Garante a pasta do arquivo de banco.
const dbPath = path.resolve(env.dbUrl);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Cria as tabelas a partir do schema.sql (idempotente) + migrações leves para bancos antigos.
export function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  // Migração: coluna whatsapp em bancos criados antes dela existir no schema.
  try {
    db.exec('ALTER TABLE usuarios ADD COLUMN whatsapp TEXT');
  } catch {
    /* coluna já existe */
  }
}

// Permite rodar `npm run db:init` direto.
if (process.argv.includes('--init')) {
  initDb();
  console.log('Schema aplicado em', dbPath);
}
