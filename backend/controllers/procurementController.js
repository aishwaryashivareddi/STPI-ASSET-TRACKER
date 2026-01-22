import { Procurement, Asset, Branch, User } from '../models/index.js';
import { Op } from 'sequelize';
import { generateProcurementId } from '../utils/idGenerator.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';

// Create procurement request
export const createProcurement = catchAsync(async (req, res) => {
  const procurement_id = await generateProcurementId(req.body.branch_id);

  const procurement = await Procurement.create({
    ...req.body,
    procurement_id,
    created_by: req.user.id
  });

  ApiResponse.created(res, procurement, 'Procurement request created');
});


export const getAllProcurements = catchAsync(async (req, res) => {
  const { branch_id, approval_status, search, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

  const where = {};
  if (branch_id) where.branch_id = branch_id;
  if (approval_status) where.approval_status = approval_status;
  
  if (search) {
    where[Op.or] = [
      { procurement_id: { [Op.like]: `%${search}%` } },
      { po_number: { [Op.like]: `%${search}%` } }
    ];
  }

  if (req.user.role !== 'Admin') {
    where.branch_id = req.user.branch_id;
  }

  const offset = (page - 1) * limit;
  const validSortFields = ['procurement_id', 'requisition_date', 'budget_allocated', 'approval_status', 'created_at'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Procurement.findAndCountAll({
    where,
    include: [
      { model: Branch, as: 'branch' },
      { model: Asset, as: 'asset' },
      { model: User, as: 'creator', attributes: ['id', 'username'] },
      { model: User, as: 'approver', attributes: ['id', 'username'] }
    ],
    limit: parseInt(limit),
    offset,
    order: [[orderField, orderDirection]]
  });

  ApiResponse.success(res, {
    procurements: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  }, 'Procurements retrieved successfully');
});


export const approveProcurement = catchAsync(async (req, res) => {
  if (!['Admin', 'Manager'].includes(req.user.role)) {
    throw new AppError('Only Admin or Manager can approve procurements', 403);
  }

  const { approval_status } = req.body;

  const procurement = await Procurement.findByPk(req.params.id);

  if (!procurement) {
    throw new AppError('Procurement not found', 404);
  }

  await procurement.update({
    approval_status,
    approved_by: req.user.id,
    approved_at: new Date()
  });

  ApiResponse.success(res, procurement, 'Procurement status updated');
});

// Update procurement
export const updateProcurement = catchAsync(async (req, res) => {
  const procurement = await Procurement.findByPk(req.params.id);

  if (!procurement) {
    throw new AppError('Procurement not found', 404);
  }

  if (req.user.role !== 'Admin' && procurement.branch_id !== req.user.branch_id) {
    throw new AppError('Access denied', 403);
  }

  await procurement.update(req.body);

  ApiResponse.success(res, procurement, 'Procurement updated');
});

// Delete procurement
export const deleteProcurement = catchAsync(async (req, res) => {
  if (req.user.role !== 'Admin') {
    throw new AppError('Only Admin can delete procurements', 403);
  }

  const procurement = await Procurement.findByPk(req.params.id);

  if (!procurement) {
    throw new AppError('Procurement not found', 404);
  }

  await procurement.destroy();

  ApiResponse.success(res, null, 'Procurement deleted');
});
