import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as procurementController from '../controllers/procurementController.js';

const router = express.Router();

/**
 * @swagger
 * /api/procurements:
 *   get:
 *     tags: [Procurement]
 *     summary: Get all procurement requests
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Approved, Rejected] }
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
 *       200: { description: Procurements retrieved }
 */

/**
 * @swagger
 * /api/procurements:
 *   post:
 *     tags: [Procurement]
 *     summary: Create procurement request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_name, quantity, estimated_cost, branch_id]
 *             properties:
 *               item_name: { type: string }
 *               quantity: { type: integer }
 *               estimated_cost: { type: number }
 *               branch_id: { type: integer }
 *               justification: { type: string }
 *     responses:
 *       201: { description: Procurement created }
 */

/**
 * @swagger
 * /api/procurements/{id}:
 *   put:
 *     tags: [Procurement]
 *     summary: Update procurement request
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
 *     responses:
 *       200: { description: Procurement updated }
 */

/**
 * @swagger
 * /api/procurements/{id}/approve:
 *   post:
 *     tags: [Procurement]
 *     summary: Approve/Reject procurement (Admin/Manager)
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
 *       200: { description: Procurement status updated }
 */

/**
 * @swagger
 * /api/procurements/{id}:
 *   delete:
 *     tags: [Procurement]
 *     summary: Delete procurement (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Procurement deleted }
 */

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
