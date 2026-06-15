// Pagamento do plano ilimitado (Pix). Cobrança/status exigem conta verificada;
// o webhook é público (o provedor chama) e valida o pagamento re-consultando o status.
import { Router } from 'express';
import * as pagamentoController from '../controllers/pagamento.controller.js';
import { exigeVerificado } from '../middlewares/exigeVerificado.js';

const router = Router();

// POST /api/pagamento/criar        — cria cobrança Pix (QR + copia-e-cola)
router.post('/criar', exigeVerificado, pagamentoController.criar);

// GET  /api/pagamento/status/:txid — front faz polling até confirmar
router.get('/status/:txid', exigeVerificado, pagamentoController.status);

// POST /api/pagamento/webhook      — confirmação do provedor → libera plano + lead
router.post('/webhook', pagamentoController.webhook);

export default router;
