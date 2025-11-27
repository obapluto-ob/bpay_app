import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRegistration, validateLogin, validateVerification } from '../middleware/validation';

const router = express.Router();
const authController = new AuthController();

// Registration flow
router.post('/register', validateRegistration, authController.register);
router.post('/verify-email', validateVerification, authController.verifyEmail);

// Login flow
router.post('/login', validateLogin, authController.login);
router.post('/verify-login', validateVerification, authController.verifyLogin);

// Resend verification code
router.post('/resend-code', authController.resendCode);

export default router;