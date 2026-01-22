import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { disposalFileUpload } from '../middleware/fileUpload.js';
import * as disposalController from '../controllers/disposalController.js';

const router = express.Router();

/**
 * @swagger
 * /api/disposals:
 *   get:
 *     tags: [Disposal]
 *     summary: Get all disposal requests
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Approved, Rejected, Disposed] }
 *       - in: query
 *         name: disposal_method
 *         schema: { type: string, enum: [Auction, Scrap, Donation, e-Waste] }
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
 *       200: { description: Disposals retrieved }
 */

/**
 * @swagger
 * /api/disposals/{id}:
 *   get:
 *     tags: [Disposal]
 *     summary: Get disposal by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Disposal retrieved }
 */

/**
 * @swagger
 * /api/disposals:
 *   post:
 *     tags: [Disposal]
 *     summary: Create disposal request
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [asset_id, disposal_method, reason]
 *             properties:
 *               asset_id: { type: integer }
 *               disposal_method: { type: string }
 *               reason: { type: string }
 *               estimated_value: { type: number }
 *               disposal_document: { type: string, format: binary }
 *     responses:
 *       201: { description: Disposal created }
 */

/**
 * @swagger
 * /api/disposals/{id}:
 *   put:
 *     tags: [Disposal]
 *     summary: Update disposal request
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
 *     responses:
 *       200: { description: Disposal updated }
 */

/**
 * @swagger
 * /api/disposals/{id}/approve:
 *   post:
 *     tags: [Disposal]
 *     summary: Approve/Reject disposal (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Approved, Rejected] }
 *               remarks: { type: string }
 *     responses:
 *       200: { description: Disposal status updated }
 */

/**
 * @swagger
 * /api/disposals/{id}:
 *   delete:
 *     tags: [Disposal]
 *     summary: Delete disposal (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Disposal deleted }
 */

/**
 * @swagger
 * /api/disposals/records:
 *   get:
 *     tags: [Disposal]
 *     summary: Get disposal records
 *     responses:
 *       200: { description: Disposal records retrieved }
 */

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
