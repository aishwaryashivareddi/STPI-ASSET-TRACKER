import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { assetFileUpload } from '../middleware/fileUpload.js';
import * as assetController from '../controllers/assetController.js';

const router = express.Router();

/**
 * @swagger
 * /api/assets:
 *   get:
 *     tags: [Assets]
 *     summary: Get all assets
 *     parameters:
 *       - in: query
 *         name: asset_type
 *         schema: { type: string }
 *       - in: query
 *         name: current_status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Assets retrieved }
 */

/**
 * @swagger
 * /api/assets/stats:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset statistics
 *     responses:
 *       200: { description: Statistics retrieved }
 */

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Asset retrieved }
 */

/**
 * @swagger
 * /api/assets:
 *   post:
 *     tags: [Assets]
 *     summary: Create new asset
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [asset_name, asset_type, branch_id]
 *             properties:
 *               asset_name: { type: string }
 *               asset_type: { type: string }
 *               branch_id: { type: integer }
 *               invoice: { type: string, format: binary }
 *               po: { type: string, format: binary }
 *     responses:
 *       201: { description: Asset created }
 */

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     tags: [Assets]
 *     summary: Update asset
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Asset updated }
 */

/**
 * @swagger
 * /api/assets/{id}/testing:
 *   post:
 *     tags: [Assets]
 *     summary: Confirm asset testing (Admin/Manager)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               testing_report: { type: string, format: binary }
 *     responses:
 *       200: { description: Testing confirmed }
 */

/**
 * @swagger
 * /api/assets/bulk/import:
 *   post:
 *     tags: [Assets]
 *     summary: Bulk import assets (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assets: { type: array }
 *     responses:
 *       201: { description: Assets imported }
 */

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     tags: [Assets]
 *     summary: Delete asset (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Asset deleted }
 */

router.use(authenticate);


router.get('/', assetController.getAllAssets);
router.get('/stats', assetController.getAssetStats);
router.get('/:id', assetController.getAssetById);


router.post('/', assetFileUpload, assetController.createAsset);
router.put('/:id', assetFileUpload, assetController.updateAsset);


router.post('/:id/testing', 
  assetFileUpload, 
  authorize(['Admin', 'Manager']), 
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
