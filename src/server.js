// Entry do MVP: sobe o Express, registra as rotas da API e serve o front estático (/public).
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { env, isDev } from './config/env.js';
import { initDb } from './db/index.js';

import cnpjRoutes from './routes/cnpj.routes.js';
import authRoutes from './routes/auth.routes.js';
import simulacaoRoutes from './routes/simulacao.routes.js';
import leadRoutes from './routes/lead.routes.js';
import pagamentoRoutes from './routes/pagamento.routes.js'; // v2 (placeholder)

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Garante que o schema existe antes de aceitar requisições.
initDb();

const app = express();
app.set('trust proxy', 1); // atrás do nginx (VPS) — IP/protocolo corretos
app.use(express.json());

// --- Rotas da API (mapeadas ao fluxo da seção 6 do CLAUDE.md) ---
app.use('/api/cnpj', cnpjRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/simulacao', simulacaoRoutes);
app.use('/api/cota', simulacaoRoutes); // GET /api/cota também mora no controller de simulação
app.use('/api/lead', leadRoutes); // captura de contato (ex.: não-optante no preview)
app.use('/api/pagamento', pagamentoRoutes); // v2

// Health check simples.
app.get('/api/health', (_req, res) => res.json({ ok: true, env: env.nodeEnv }));

// --- Front estático do MVP ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Tratador de erro centralizado ---
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (isDev) console.error(err);
  const status = err.status || 500;
  res.status(status).json({ erro: err.publico || 'Erro interno.' });
});

app.listen(env.port, () => {
  console.log(`iContábil Simulador rodando em http://localhost:${env.port} (${env.nodeEnv})`);
});
