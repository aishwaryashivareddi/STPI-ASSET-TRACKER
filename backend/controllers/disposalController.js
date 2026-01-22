import { Disposal, Asset, User, Branch } from '../models/index.js';
import { Op } from 'sequelize';
import { generateDisposalId } from '../utils/idGenerator.js';
import { getFilePaths } from '../middleware/fileUpload.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';

export const createDisposal = catchAsync(async (req, res) => {
  const { asset_id } = req.body;

  if (!asset_id) {
    throw new AppError('asset_id is required', 400);
  }

  const asset = await Asset.findByPk(asset_id);
  if (!asset) throw new AppError('Asset not found', 404);

  const disposal_id = await generateDisposalId(asset.branch_id);
  const filePaths = getFilePaths(req);

  const disposal = await Disposal.create({
    ...req.body,
    disposal_id,
    ...filePaths
  });

  ApiResponse.created(res, disposal, 'Disposal request created');
});

export const getAllDisposals = catchAsync(async (req, res) => {
  const { status, disposal_method, search, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (disposal_method) where.disposal_method = disposal_method;
  
  if (search) {
    where[Op.or] = [
      { disposal_id: { [Op.like]: `%${search}%` } },
      { reason: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;
  const validSortFields = ['disposal_id', 'disposal_date', 'disposal_value', 'status', 'created_at'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Disposal.findAndCountAll({
    where,
    include: [
      { model: Asset, as: 'asset', include: [{ model: Branch, as: 'branch' }] },
      { model: User, as: 'approver', attributes: ['id', 'username'] }
    ],
    limit: parseInt(limit),
    offset,
    order: [[orderField, orderDirection]]
  });

  ApiResponse.success(res, {
    disposals: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  });
});

export const getDisposalById = catchAsync(async (req, res) => {
  const disposal = await Disposal.findByPk(req.params.id, {
    include: [
      { model: Asset, as: 'asset' },
      { model: User, as: 'approver', attributes: ['id', 'username'] }
    ]
  });

  if (!disposal) {
    throw new AppError('Disposal not found', 404);
  }

  ApiResponse.success(res, disposal, 'Disposal retrieved successfully');
});

export const approveDisposal = catchAsync(async (req, res) => {
  if (req.user.role !== 'Admin') {
    throw new AppError('Only Admin can approve disposals', 403);
  }

  const { status } = req.body;

  const disposal = await Disposal.findByPk(req.params.id, {
    include: [{ model: Asset, as: 'asset' }]
  });

  if (!disposal) {
    throw new AppError('Disposal not found', 404);
  }

  await disposal.update({
    status,
    approved_by: req.user.id,
    approved_at: new Date()
  });

  if (status === 'Approved' && disposal.asset) {
    await disposal.asset.update({ current_status: 'Disposed' });
  }

  ApiResponse.success(res, disposal, 'Disposal status updated');
});

export const updateDisposal = catchAsync(async (req, res) => {
  const disposal = await Disposal.findByPk(req.params.id);

  if (!disposal) {
    throw new AppError('Disposal not found', 404);
  }

  const filePaths = getFilePaths(req);

  await disposal.update({
    ...req.body,
    ...filePaths
  });

  ApiResponse.success(res, disposal, 'Disposal updated');
});

export const deleteDisposal = catchAsync(async (req, res) => {
  if (req.user.role !== 'Admin') {
    throw new AppError('Only Admin can delete disposals', 403);
  }

  const disposal = await Disposal.findByPk(req.params.id);

  if (!disposal) {
    throw new AppError('Disposal not found', 404);
  }

  await disposal.destroy();

  ApiResponse.success(res, null, 'Disposal deleted');
});

export const getDisposalRecords = getAllDisposals;
