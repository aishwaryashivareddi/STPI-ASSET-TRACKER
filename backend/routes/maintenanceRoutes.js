import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { maintenanceFileUpload } from '../middleware/fileUpload.js';
import * as maintenanceController from '../controllers/maintenanceController.js';

const router = express.Router();

/**
 * @swagger
 * /api/maintenances:
 *   get:
 *     tags: [Maintenance]
 *     summary: Get all maintenance records
 *     parameters:
 *       - in: query
 *         name: asset_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Scheduled, In Progress, Completed] }
 *       - in: query
 *         name: maintenance_type
 *         schema: { type: string, enum: [Preventive, Corrective, Emergency] }
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
 *       200: { description: Maintenances retrieved }
 */

/**
 * @swagger
 * /api/maintenances/stats:
 *   get:
 *     tags: [Maintenance]
 *     summary: Get maintenance statistics
 *     responses:
 *       200: { description: Statistics retrieved }
 */

/**
 * @swagger
 * /api/maintenances:
 *   post:
 *     tags: [Maintenance]
 *     summary: Create maintenance record
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [asset_id, maintenance_type, scheduled_date]
 *             properties:
 *               asset_id: { type: integer }
 *               maintenance_type: { type: string }
 *               scheduled_date: { type: string, format: date }
 *               issue_description: { type: string }
 *               cost: { type: number }
 *               maintenance_report: { type: string, format: binary }
 *     responses:
 *       201: { description: Maintenance created }
 */

/**
 * @swagger
 * /api/maintenances/{id}:
 *   put:
 *     tags: [Maintenance]
 *     summary: Update maintenance record
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
 *       200: { description: Maintenance updated }
 */

/**
 * @swagger
 * /api/maintenances/{id}/complete:
 *   post:
 *     tags: [Maintenance]
 *     summary: Complete maintenance
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
 *               maintenance_report: { type: string, format: binary }
 *     responses:
 *       200: { description: Maintenance completed }
 */

/**
 * @swagger
 * /api/maintenances/{id}:
 *   delete:
 *     tags: [Maintenance]
 *     summary: Delete maintenance (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Maintenance deleted }
 */

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
