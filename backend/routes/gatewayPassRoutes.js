import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as gpController from '../controllers/gatewayPassController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', gpController.getAllGatewayPasses);
router.post('/', gpController.createGatewayPass);

// Level 1 - Manager Approval (Admin/Manager)
router.post('/:id/manager-approve', authorize(['Admin', 'Manager']), gpController.managerApprove);

// Level 2 - Admin Approval (Admin only)
router.post('/:id/admin-approve', authorize(['Admin']), gpController.adminApprove);

// Level 3 - Receiver Confirmation (any authenticated user at destination branch)
router.post('/:id/receive', gpController.receiverConfirm);

// Delete (Admin only)
router.delete('/:id', authorize(['Admin']), gpController.deleteGatewayPass);

export default router;
