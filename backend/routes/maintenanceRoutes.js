import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { maintenanceFileUpload } from '../middleware/fileUpload.js';
import * as maintenanceController from '../controllers/maintenanceController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', maintenanceController.getAllMaintenances);
router.get('/stats', maintenanceController.getMaintenanceStats);
router.post('/', maintenanceFileUpload, maintenanceController.createMaintenance);
router.put('/:id', maintenanceFileUpload, maintenanceController.updateMaintenance);
router.post('/:id/complete', maintenanceFileUpload, maintenanceController.completeMaintenance);


router.delete('/:id', 
  authorize(['Admin']), 
  maintenanceController.deleteMaintenance
);

export default router;
