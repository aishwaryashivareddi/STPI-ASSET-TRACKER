import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as gpController from '../controllers/gatewayPassController.js';
import { gatewayPassFileUpload } from '../middleware/fileUpload.js';

const router = express.Router();

router.use(authenticate);

router.get('/', gpController.getAllGatewayPasses);
router.get('/:id', gpController.getGatewayPassById);
router.get('/:id/download-pdf', gpController.downloadGatewayPassPDF);
router.get('/:id/download-signed', gpController.downloadSignedCopy);
router.post('/', gpController.createGatewayPass);
router.put('/:id', gpController.updateGatewayPass);
router.post('/:id/upload-signed', gatewayPassFileUpload, gpController.uploadSignedCopy);
router.delete('/:id/signed-copy', gpController.deleteSignedCopy);
router.delete('/:id', authorize(['Admin']), gpController.deleteGatewayPass);

export default router;
