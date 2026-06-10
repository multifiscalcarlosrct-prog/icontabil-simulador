// CNPJ — livre, sem cota (seção 12). Preview cadastral.
import { Router } from 'express';
import * as cnpjController from '../controllers/cnpj.controller.js';

const router = Router();

// GET /api/cnpj/:cnpj — preview cadastral (razão social, CNAE, porte, optante Simples, UF/município)
router.get('/:cnpj', cnpjController.preview);

export default router;
