// Simulação — núcleo, consome crédito (seção 12). Inclui /api/cota.
import { Router } from 'express';
import * as simulacaoController from '../controllers/simulacao.controller.js';
import { exigeVerificado } from '../middlewares/exigeVerificado.js';
import { checaCota } from '../middlewares/checaCota.js';

const router = Router();

// POST /api/simulacao  { cnpj, faturamento, pctPJ, pesoInsumos, setor }
// Cota: se o CNPJ já foi simulado por esta conta, usa cache e NÃO debita (checaCota cuida disso).
router.post('/', exigeVerificado, checaCota, simulacaoController.simular);

// GET /api/simulacao/:id/pdf — gera/baixa o relatório PDF
router.get('/:id/pdf', exigeVerificado, simulacaoController.baixarPdf);

// GET /api/cota — créditos restantes da conta logada (montado em /api/cota no server.js)
router.get('/', exigeVerificado, simulacaoController.cota);

export default router;
