import { Asset, Branch, Supplier, User } from '../models/index.js';
import { Op } from 'sequelize';
import { generateAssetId } from '../utils/idGenerator.js';
import { getFilePaths } from '../middleware/fileUpload.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';

// Create new asset
export const createAsset = catchAsync(async (req, res) => {
  const { branch_id, asset_type } = req.body;
  
  // Generate unique asset ID
  const asset_id = await generateAssetId(branch_id, asset_type);
  
  // Get uploaded file paths
  const filePaths = getFilePaths(req);
  
  // Convert empty strings to null for optional fields
  const cleanedData = { ...req.body };
  ['supplier_id', 'location', 'po_number', 'purchase_value'].forEach(field => {
    if (cleanedData[field] === '' || cleanedData[field] === undefined) {
      cleanedData[field] = null;
    }
  });
  
  const asset = await Asset.create({
    ...cleanedData,
    asset_id,
    ...filePaths,
    created_by: req.user.id
  });

  const assetWithDetails = await Asset.findByPk(asset.id, {
    include: [
      { model: Branch, as: 'branch' },
      { model: Supplier, as: 'supplier' },
      { model: User, as: 'creator', attributes: ['id', 'username', 'email'] }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: assetWithDetails
  });
});

// Get all assets with filters
export const getAllAssets = catchAsync(async (req, res) => {
  const { 
    branch_id, 
    asset_type, 
    current_status, 
    testing_status,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    page = 1, 
    limit = 20
  } = req.query;

  const where = {};
  if (branch_id) where.branch_id = branch_id;
  if (asset_type) where.asset_type = asset_type;
  if (current_status) where.current_status = current_status;
  if (testing_status) where.testing_status = testing_status;
  
  if (search) {
    where[Op.or] = [
      { asset_id: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
      { serial_number: { [Op.like]: `%${search}%` } }
    ];
  }

  if (req.user.role !== 'Admin') {
    where.branch_id = req.user.branch_id;
  }

  const offset = (page - 1) * limit;
  const validSortFields = ['asset_id', 'name', 'asset_type', 'current_status', 'purchase_value', 'created_at'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Asset.findAndCountAll({
    where,
    include: [
      { model: Branch, as: 'branch' },
      { model: Supplier, as: 'supplier' },
      { model: User, as: 'creator', attributes: ['id', 'username'] },
      { model: User, as: 'tester', attributes: ['id', 'username'] }
    ],
    limit: parseInt(limit),
    offset,
    order: [[orderField, orderDirection]]
  });

  ApiResponse.success(res, {
    assets: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  }, 'Assets retrieved successfully');
});

// Get single asset
export const getAssetById = catchAsync(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id, {
    include: [
      { model: Branch, as: 'branch' },
      { model: Supplier, as: 'supplier' },
      { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
      { model: User, as: 'tester', attributes: ['id', 'username', 'email'] }
    ]
  });

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Non-admin users can only view their branch assets
  if (req.user.role !== 'Admin' && asset.branch_id !== req.user.branch_id) {
    throw new AppError('Access denied', 403);
  }

  ApiResponse.success(res, asset, 'Asset retrieved successfully');
});

// Update asset
export const updateAsset = catchAsync(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Non-admin users can only update their branch assets
  if (req.user.role !== 'Admin' && asset.branch_id !== req.user.branch_id) {
    throw new AppError('Access denied', 403);
  }

  const filePaths = getFilePaths(req);

  await asset.update({
    ...req.body,
    ...filePaths,
    updated_by: req.user.id
  });

  const updatedAsset = await Asset.findByPk(asset.id, {
    include: [
      { model: Branch, as: 'branch' },
      { model: Supplier, as: 'supplier' }
    ]
  });

  ApiResponse.success(res, updatedAsset, 'Asset updated successfully');
});

// Confirm testing (Admin/Manager only)
export const confirmTesting = catchAsync(async (req, res) => {
  const { testing_status, remarks } = req.body;

  const asset = await Asset.findByPk(req.params.id);

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  const filePaths = getFilePaths(req);

  await asset.update({
    testing_status,
    remarks,
    tested_by: req.user.id,
    tested_at: new Date(),
    ...filePaths
  });

  ApiResponse.success(res, asset, 'Testing status updated successfully');
});

// Delete asset (Admin only)
export const deleteAsset = catchAsync(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  await asset.destroy();

  ApiResponse.success(res, null, 'Asset deleted successfully');
});

// Get asset statistics
export const getAssetStats = catchAsync(async (req, res) => {
  const where = {};
  
  if (req.user.role !== 'Admin') {
    where.branch_id = req.user.branch_id;
  }

  const [
    totalAssets,
    workingAssets,
    notWorkingAssets,
    obsoleteAssets,
    pendingTesting,
    byType
  ] = await Promise.all([
    Asset.count({ where }),
    Asset.count({ where: { ...where, current_status: 'Working' } }),
    Asset.count({ where: { ...where, current_status: 'Not Working' } }),
    Asset.count({ where: { ...where, current_status: 'Obsolete' } }),
    Asset.count({ where: { ...where, testing_status: 'Pending' } }),
    Asset.findAll({
      where,
      attributes: [
        'asset_type',
        [Asset.sequelize.fn('COUNT', Asset.sequelize.col('id')), 'count']
      ],
      group: ['asset_type']
    })
  ]);

  ApiResponse.success(res, {
    totalAssets,
    workingAssets,
    notWorkingAssets,
    obsoleteAssets,
    pendingTesting,
    byType
  }, 'Statistics retrieved successfully');
});

// Bulk import assets
export const bulkImportAssets = catchAsync(async (req, res) => {
  const { assets } = req.body;

  if (!Array.isArray(assets) || assets.length === 0) {
    throw new AppError('Invalid assets data', 400);
  }

  const createdAssets = [];

  for (const assetData of assets) {
    const asset_id = await generateAssetId(assetData.branch_id, assetData.asset_type);
    const asset = await Asset.create({
      ...assetData,
      asset_id,
      created_by: req.user.id
    });
    createdAssets.push(asset);
  }

  res.status(201).json({
    success: true,
    message: `${createdAssets.length} assets imported successfully`,
    data: { count: createdAssets.length, assets: createdAssets }
  });
});
