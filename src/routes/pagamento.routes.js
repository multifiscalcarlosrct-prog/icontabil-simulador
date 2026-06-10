// Pagamento — v2 (placeholder). Não faz parte do MVP da seção 10.
import { Router } from 'express';
import * as pagamentoController from '../controllers/pagamento.controller.js';

const router = Router();

// POST /api/pagamento/criar   — cria cobrança Pix (Mercado Pago/Asaas)  [v2]
router.post('/criar', pagamentoController.criar);

// POST /api/pagamento/webhook — confirmação do gateway → seta plano = pago [v2]
router.post('/webhook', pagamentoController.webhook);

export default router;
