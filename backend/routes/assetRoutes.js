import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { assetFileUpload } from '../middleware/fileUpload.js';
import * as assetController from '../controllers/assetController.js';

const router = express.Router();

router.use(authenticate);


router.get('/', assetController.getAllAssets);
router.get('/stats', assetController.getAssetStats);
router.get('/:id', assetController.getAssetById);


router.post('/', assetFileUpload, assetController.createAsset);
router.put('/:id', assetFileUpload, assetController.updateAsset);


router.post('/:id/testing', 
  authorize(['Admin', 'Manager']), 
  assetFileUpload, 
  assetController.confirmTesting
);


router.post('/bulk/import', 
  authorize(['Admin']), 
  assetController.bulkImportAssets
);


router.delete('/:id', 
  authorize(['Admin']), 
  assetController.deleteAsset
);

export default router;
