import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['Admin']));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.post('/:id/reset-password', userController.resetUserPassword);
router.delete('/:id', userController.deleteUser);

export default router;
