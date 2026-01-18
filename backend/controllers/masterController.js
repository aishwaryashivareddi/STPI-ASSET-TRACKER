import { Supplier } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';

export const createSupplier = catchAsync(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json(ApiResponse.success(supplier, 'Supplier created'));
});
