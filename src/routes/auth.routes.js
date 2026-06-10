// Autenticação por OTP (e-mail no MVP; WhatsApp na v2).
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/solicitar-otp  { contato }
router.post('/solicitar-otp', authController.solicitarOtp);

// POST /api/auth/verificar-otp  { contato, codigo }
router.post('/verificar-otp', authController.verificarOtp);

export default router;
