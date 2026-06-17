// Painel de admin (somente leitura). Tudo protegido por ADMIN_TOKEN.
import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { exigeAdmin } from '../middlewares/exigeAdmin.js';

const router = Router();

router.get('/stats', exigeAdmin, adminController.stats); // KPIs + distribuições
router.get('/leads', exigeAdmin, adminController.leads); // últimas simulações

export default router;
