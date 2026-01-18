import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { disposalFileUpload } from '../middleware/fileUpload.js';
import * as disposalController from '../controllers/disposalController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', disposalController.getAllDisposals);
router.get('/:id', disposalController.getDisposalById);
router.post('/', disposalFileUpload, disposalController.createDisposal);
router.put('/:id', disposalFileUpload, disposalController.updateDisposal);

router.post('/:id/approve', 
  authorize(['Admin']), 
  disposalController.approveDisposal
);


router.delete('/:id', 
  authorize(['Admin']), 
  disposalController.deleteDisposal
);


router.get('/records', disposalController.getDisposalRecords);

export default router;
