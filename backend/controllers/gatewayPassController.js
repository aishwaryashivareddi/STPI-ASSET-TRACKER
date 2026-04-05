import { GatewayPass, Asset, Branch, User } from '../models/index.js';
import { Op } from 'sequelize';
import { generateGatewayPassId } from '../utils/idGenerator.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';

const GP_INCLUDES = [
  { model: Asset, as: 'asset' },
  { model: Branch, as: 'fromBranch' },
  { model: Branch, as: 'toBranch' },
  { model: User, as: 'creator', attributes: ['id', 'username'] },
  { model: User, as: 'managerApprover', attributes: ['id', 'username'] },
  { model: User, as: 'adminApprover', attributes: ['id', 'username'] },
  { model: User, as: 'receiver', attributes: ['id', 'username'] }
];

// Create gateway pass request
export const createGatewayPass = catchAsync(async (req, res) => {
  const { asset_id, to_branch_id, reason, transfer_date } = req.body;

  const asset = await Asset.findByPk(asset_id);
  if (!asset) throw new AppError('Asset not found', 404);

  if (asset.branch_id === parseInt(to_branch_id)) {
    throw new AppError('Source and destination branch cannot be the same', 400);
  }

  const existing = await GatewayPass.findOne({
    where: { asset_id, status: { [Op.in]: ['Pending', 'Manager Approved', 'Admin Approved'] } }
  });
  if (existing) throw new AppError('Asset already has a pending transfer request', 400);

  const gateway_pass_id = await generateGatewayPassId(asset.branch_id);

  const gp = await GatewayPass.create({
    gateway_pass_id,
    asset_id,
    from_branch_id: asset.branch_id,
    to_branch_id,
    reason,
    transfer_date,
    created_by: req.user.id
  });

  const result = await GatewayPass.findByPk(gp.id, { include: GP_INCLUDES });
  ApiResponse.created(res, result, 'Gateway pass created');
});

// Get all gateway passes
export const getAllGatewayPasses = catchAsync(async (req, res) => {
  const { status, search, sortBy = 'createdAt', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { gateway_pass_id: { [Op.like]: `%${search}%` } },
      { reason: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;
  const validSortFields = ['gateway_pass_id', 'transfer_date', 'status', 'createdAt'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await GatewayPass.findAndCountAll({
    where,
    include: GP_INCLUDES,
    limit: parseInt(limit),
    offset,
    order: [[orderField, orderDirection]]
  });

  ApiResponse.success(res, {
    gatewayPasses: rows,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
  });
});

// Level 1 - Manager Approval
export const managerApprove = catchAsync(async (req, res) => {
  const { status, remarks } = req.body;
  const gp = await GatewayPass.findByPk(req.params.id);

  if (!gp) throw new AppError('Gateway pass not found', 404);
  if (gp.status !== 'Pending') throw new AppError('Gateway pass is not pending manager approval', 400);

  const newStatus = status === 'Approved' ? 'Manager Approved' : 'Rejected';

  await gp.update({
    manager_status: status,
    manager_approved_by: req.user.id,
    manager_approved_at: new Date(),
    manager_remarks: remarks,
    status: newStatus
  });

  const result = await GatewayPass.findByPk(gp.id, { include: GP_INCLUDES });
  ApiResponse.success(res, result, `Gateway pass ${status.toLowerCase()} by manager`);
});

// Level 2 - Admin Approval
export const adminApprove = catchAsync(async (req, res) => {
  const { status, remarks } = req.body;
  const gp = await GatewayPass.findByPk(req.params.id);

  if (!gp) throw new AppError('Gateway pass not found', 404);
  if (gp.status !== 'Manager Approved') throw new AppError('Gateway pass is not pending admin approval', 400);

  const newStatus = status === 'Approved' ? 'Admin Approved' : 'Rejected';

  await gp.update({
    admin_status: status,
    admin_approved_by: req.user.id,
    admin_approved_at: new Date(),
    admin_remarks: remarks,
    status: newStatus
  });

  const result = await GatewayPass.findByPk(gp.id, { include: GP_INCLUDES });
  ApiResponse.success(res, result, `Gateway pass ${status.toLowerCase()} by admin`);
});

// Level 3 - Receiver Confirmation
export const receiverConfirm = catchAsync(async (req, res) => {
  const { status, remarks } = req.body;
  const gp = await GatewayPass.findByPk(req.params.id, { include: [{ model: Asset, as: 'asset' }] });

  if (!gp) throw new AppError('Gateway pass not found', 404);
  if (gp.status !== 'Admin Approved') throw new AppError('Gateway pass is not pending receiver confirmation', 400);

  const newStatus = status === 'Received' ? 'Completed' : 'Rejected';

  await gp.update({
    receiver_status: status,
    received_by: req.user.id,
    received_at: new Date(),
    receiver_remarks: remarks,
    status: newStatus
  });

  // Transfer asset to new branch on completion
  if (newStatus === 'Completed') {
    await gp.asset.update({ branch_id: gp.to_branch_id });
  }

  const result = await GatewayPass.findByPk(gp.id, { include: GP_INCLUDES });
  ApiResponse.success(res, result, `Asset ${newStatus === 'Completed' ? 'received and transferred' : 'rejected by receiver'}`);
});

// Delete gateway pass (Admin only)
export const deleteGatewayPass = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id);
  if (!gp) throw new AppError('Gateway pass not found', 404);

  await gp.destroy();
  ApiResponse.success(res, null, 'Gateway pass deleted');
});
