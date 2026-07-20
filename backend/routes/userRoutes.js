import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Please try again after an hour.' }
});

// Public — no auth required
router.post('/self-register', registerLimiter, userController.selfRegister);

// All routes below require authentication + Admin role
router.use(authenticate);
router.use(authorize(['Admin']));

router.get('/', userController.getAllUsers);
router.get('/pending', userController.getPendingUsers);
router.get('/rejected', userController.getRejectedUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.post('/:id/approve', userController.approveUser);
router.post('/:id/reject', userController.rejectUser);
router.post('/:id/reset-password', userController.resetUserPassword);
router.delete('/:id', userController.deleteUser);

export default router;
