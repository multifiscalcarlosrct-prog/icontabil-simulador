// Painel de admin — KPIs e últimas simulações (somente leitura).
import * as adminRepo from '../db/repositories/adminRepo.js';

// GET /api/admin/stats
export function stats(_req, res, next) {
  try {
    res.json(adminRepo.estatisticas());
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/leads?limite=50
export function leads(req, res, next) {
  try {
    const limite = Math.min(Math.max(Number(req.query.limite) || 50, 1), 200);
    res.json({ leads: adminRepo.ultimasSimulacoes(limite) });
  } catch (err) {
    next(err);
  }
}
