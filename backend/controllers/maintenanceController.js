import { Maintenance, Asset, User, Branch } from '../models/index.js';
import { Op } from 'sequelize';
import { generateMaintenanceId } from '../utils/idGenerator.js';
import { getFilePaths } from '../middleware/fileUpload.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';

// Create maintenance record
export const createMaintenance = catchAsync(async (req, res) => {
  const asset = await Asset.findByPk(req.body.asset_id);
  
  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  const maintenance_id = await generateMaintenanceId(asset.branch_id);
  const filePaths = getFilePaths(req);

  const maintenance = await Maintenance.create({
    ...req.body,
    maintenance_id,
    ...filePaths,
    performed_by: req.user.id
  });

  ApiResponse.created(res, maintenance, 'Maintenance record created');
});

// Get all maintenance records
export const getAllMaintenances = catchAsync(async (req, res) => {
  const { asset_id, status, maintenance_type, search, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

  const where = {};
  if (asset_id) where.asset_id = asset_id;
  if (status) where.status = status;
  if (maintenance_type) where.maintenance_type = maintenance_type;
  
  if (search) {
    where[Op.or] = [
      { maintenance_id: { [Op.like]: `%${search}%` } },
      { issue_description: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;
  const validSortFields = ['maintenance_id', 'scheduled_date', 'cost', 'status', 'created_at'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Maintenance.findAndCountAll({
    where,
    include: [
      { 
        model: Asset, 
        as: 'asset',
        include: [{ model: Branch, as: 'branch' }]
      },
      { model: User, as: 'performer', attributes: ['id', 'username'] }
    ],
    limit: parseInt(limit),
    offset,
    order: [[orderField, orderDirection]]
  });

  ApiResponse.success(res, {
    maintenances: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  }, 'Maintenances retrieved successfully');
});

// Update maintenance record
export const updateMaintenance = catchAsync(async (req, res) => {
  const maintenance = await Maintenance.findByPk(req.params.id);

  if (!maintenance) {
    throw new AppError('Maintenance record not found', 404);
  }

  const filePaths = getFilePaths(req);

  await maintenance.update({
    ...req.body,
    ...filePaths
  });

  ApiResponse.success(res, maintenance, 'Maintenance record updated');
});

// Complete maintenance
export const completeMaintenance = catchAsync(async (req, res) => {
  const maintenance = await Maintenance.findByPk(req.params.id, {
    include: [{ model: Asset, as: 'asset' }]
  });

  if (!maintenance) {
    throw new AppError('Maintenance record not found', 404);
  }

  const filePaths = getFilePaths(req);

  await maintenance.update({
    status: 'Completed',
    completed_date: new Date(),
    ...req.body,
    ...filePaths
  });

  // Update asset status if it was under repair
  if (maintenance.asset.current_status === 'Under Repair') {
    await maintenance.asset.update({ current_status: 'Working' });
  }

  ApiResponse.success(res, maintenance, 'Maintenance completed');
});

// Delete maintenance record
export const deleteMaintenance = catchAsync(async (req, res) => {
  if (req.user.role !== 'Admin') {
    throw new AppError('Only Admin can delete maintenance records', 403);
  }

  const maintenance = await Maintenance.findByPk(req.params.id);

  if (!maintenance) {
    throw new AppError('Maintenance record not found', 404);
  }

  await maintenance.destroy();

  ApiResponse.success(res, null, 'Maintenance record deleted');
});

// Get maintenance statistics
export const getMaintenanceStats = catchAsync(async (req, res) => {
  const [
    totalMaintenances,
    scheduled,
    inProgress,
    completed,
    totalCost
  ] = await Promise.all([
    Maintenance.count(),
    Maintenance.count({ where: { status: 'Scheduled' } }),
    Maintenance.count({ where: { status: 'In Progress' } }),
    Maintenance.count({ where: { status: 'Completed' } }),
    Maintenance.sum('cost')
  ]);

  ApiResponse.success(res, {
    totalMaintenances,
    scheduled,
    inProgress,
    completed,
    totalCost: totalCost || 0
  }, 'Maintenance statistics retrieved successfully');
});
