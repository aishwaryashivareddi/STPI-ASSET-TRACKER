import express from 'express';
import { createSupplier } from '../controllers/masterController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Branch, Supplier } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = express.Router();

/**
 * @swagger
 * /api/master/branches:
 *   get:
 *     tags: [Master Data]
 *     summary: Get all branches
 *     responses:
 *       200: { description: Branches retrieved }
 */

/**
 * @swagger
 * /api/master/branches:
 *   post:
 *     tags: [Master Data]
 *     summary: Create branch (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branch_name, branch_code, location]
 *             properties:
 *               branch_name: { type: string }
 *               branch_code: { type: string }
 *               location: { type: string }
 *               contact_person: { type: string }
 *               contact_email: { type: string }
 *               contact_phone: { type: string }
 *     responses:
 *       201: { description: Branch created }
 */

/**
 * @swagger
 * /api/master/suppliers:
 *   get:
 *     tags: [Master Data]
 *     summary: Get all suppliers
 *     responses:
 *       200: { description: Suppliers retrieved }
 */

/**
 * @swagger
 * /api/master/suppliers:
 *   post:
 *     tags: [Master Data]
 *     summary: Create supplier (Admin/Manager)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplier_name, contact_person]
 *             properties:
 *               supplier_name: { type: string }
 *               contact_person: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       201: { description: Supplier created }
 */

router.get('/branches', authenticate, catchAsync(async (req, res) => {
  const branches = await Branch.findAll({ where: { is_active: true } });
  ApiResponse.success(res, branches);
}));

router.post('/branches', authenticate, authorize(['Admin']), catchAsync(async (req, res) => {
  const branch = await Branch.create(req.body);
  ApiResponse.success(res, branch, 'Branch created');
}));

router.get('/suppliers', authenticate, catchAsync(async (req, res) => {
  const suppliers = await Supplier.findAll();
  ApiResponse.success(res, suppliers);
}));

router.post('/suppliers', authenticate, authorize(['Admin', 'Manager']), createSupplier);

export default router;
