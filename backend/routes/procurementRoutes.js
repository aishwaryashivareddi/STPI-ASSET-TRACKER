import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as procurementController from '../controllers/procurementController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', procurementController.getAllProcurements);
router.post('/', procurementController.createProcurement);
router.put('/:id', procurementController.updateProcurement);

// Approval (Admin/Manager only)
router.post('/:id/approve', 
  authorize(['Admin', 'Manager']), 
  procurementController.approveProcurement
);

// Delete (Admin only)
router.delete('/:id', 
  authorize(['Admin']), 
  procurementController.deleteProcurement
);

export default router;
