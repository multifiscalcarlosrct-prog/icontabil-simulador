// Captura de contato fora do fluxo com cota (ex.: não-optante bloqueado no preview).
import { Router } from 'express';
import * as leadService from '../services/leadService.js';

const router = Router();

// POST /api/lead — body { contato, cnpj, nome, motivo }
router.post('/', (req, res) => {
  const { contato, cnpj, nome, motivo } = req.body || {};
  const c = String(contato || '').trim();
  if (c.length < 8) return res.status(400).json({ erro: 'Informe um e-mail ou WhatsApp válido.' });

  const ehNaoOptante = motivo === 'nao_optante_simples';
  leadService
    .enviarLead({
      tipo: ehNaoOptante ? 'nao_optante_simples' : 'contato_site',
      contato: c,
      nome: nome || null,
      cnpj: cnpj || null,
      ...(ehNaoOptante && { optante_simples: false, regime_atual: 'Não optante pelo Simples' }),
    })
    .catch(() => {});

  res.json({ ok: true });
});

export default router;
