import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as gpController from '../controllers/gatewayPassController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', gpController.getAllGatewayPasses);
router.get('/:id/download-pdf', gpController.downloadGatewayPassPDF);
router.post('/', gpController.createGatewayPass);
router.delete('/:id', authorize(['Admin']), gpController.deleteGatewayPass);

export default router;
