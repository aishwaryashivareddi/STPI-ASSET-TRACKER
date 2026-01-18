import express from 'express';
import { createSupplier } from '../controllers/masterController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Branch, Supplier } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = express.Router();

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
