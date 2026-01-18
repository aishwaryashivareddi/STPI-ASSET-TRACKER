import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, updatePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateLogin, validateRegister, validateForgotPassword, validateResetPassword } from '../validators/authValidator.js';

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' }
});

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/profile', authenticate, getProfile);
router.get('/me', authenticate, getProfile);
router.patch('/update-password', authenticate, updatePassword);

export default router;
