import { Asset, Branch, Supplier, User } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/sequelize.js';
import { generateAssetId } from '../utils/idGenerator.js';
import { getFilePaths, deleteFile } from '../middleware/fileUpload.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';
import * as XLSX from 'xlsx';

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
      { serial_number: { [Op.like]: `%${search}%` } },
      { asset_type: { [Op.like]: `%${search}%` } },
      { '$supplier.name$': { [Op.like]: `%${search}%` } }
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

  const cleanedData = { ...req.body };
  ['supplier_id', 'location', 'po_number', 'purchase_value'].forEach(field => {
    if (cleanedData[field] === '' || cleanedData[field] === undefined) {
      cleanedData[field] = null;
    }
  });

  await asset.update({
    ...cleanedData,
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

// Delete a specific file from an asset
export const deleteAssetFile = catchAsync(async (req, res) => {
  const { fileField } = req.params;
  const validFields = ['invoice_file', 'po_file', 'dc_file', 'testing_report_file'];

  if (!validFields.includes(fileField)) {
    throw new AppError('Invalid file field', 400);
  }

  const asset = await Asset.findByPk(req.params.id);
  if (!asset) throw new AppError('Asset not found', 404);
  if (!asset[fileField]) throw new AppError('No file to delete', 404);

  deleteFile(asset[fileField]);
  await asset.update({ [fileField]: null });

  ApiResponse.success(res, null, 'File deleted successfully');
});

// Download a specific file
export const downloadAssetFile = catchAsync(async (req, res) => {
  const { fileField } = req.params;
  const validFields = ['invoice_file', 'po_file', 'dc_file', 'testing_report_file'];

  if (!validFields.includes(fileField)) throw new AppError('Invalid file field', 400);

  const asset = await Asset.findByPk(req.params.id);
  if (!asset) throw new AppError('Asset not found', 404);
  if (!asset[fileField]) throw new AppError('No file found', 404);

  const filePath = asset[fileField];
  const fileName = filePath.split(/[\\/]/).pop();
  res.download(filePath, fileName);
});

// Bulk create assets with transaction
export const bulkCreateAssets = catchAsync(async (req, res) => {
  const { branch_id, asset_type, quantity, ...commonData } = req.body;
  const qty = parseInt(quantity);

  if (!qty || qty < 2 || qty > 500) throw new AppError('Quantity must be between 2 and 500', 400);

  const cleanedData = { ...commonData };
  ['supplier_id', 'location', 'po_number', 'purchase_value'].forEach(field => {
    if (cleanedData[field] === '' || cleanedData[field] === undefined) cleanedData[field] = null;
  });

  const t = await sequelize.transaction();
  try {
    const createdAssets = [];
    for (let i = 0; i < qty; i++) {
      const asset_id = await generateAssetId(branch_id, asset_type, i);
      const asset = await Asset.create({
        ...cleanedData, asset_id, branch_id, asset_type, created_by: req.user.id
      }, { transaction: t });
      createdAssets.push(asset);
    }
    await t.commit();
    ApiResponse.created(res, { count: createdAssets.length, asset_ids: createdAssets.map(a => a.asset_id) }, `${qty} assets created successfully`);
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

// Bulk import assets from Excel/CSV file
export const bulkImportAssets = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) throw new AppError('File is empty or has no data rows', 400);

  // Validate required columns
  const required = ['name', 'asset_type', 'branch_id'];
  const headers = Object.keys(rows[0]).map(k => k.toLowerCase().trim());
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length) throw new AppError(`Missing required columns: ${missing.join(', ')}`, 400);

  const VALID_TYPES = ['HSDC', 'COMPUTER', 'ELECTRICAL', 'OFFICE', 'FURNITURE', 'FIREFIGHTING', 'BUILDING'];

  const t = await sequelize.transaction();
  const createdAssets = [];
  const errors = [];

  try {
    for (let i = 0; i < rows.length; i++) {
      // Normalize keys to lowercase
      const raw = Object.fromEntries(Object.entries(rows[i]).map(([k, v]) => [k.toLowerCase().trim(), v]));

      const asset_type = String(raw.asset_type || '').toUpperCase().trim();
      if (!VALID_TYPES.includes(asset_type)) {
        errors.push(`Row ${i + 2}: Invalid asset_type "${raw.asset_type}". Must be one of: ${VALID_TYPES.join(', ')}`);
        continue;
      }

      const branch_id = parseInt(raw.branch_id);
      if (!branch_id) {
        errors.push(`Row ${i + 2}: Invalid branch_id "${raw.branch_id}"`);
        continue;
      }

      const asset_id = await generateAssetId(branch_id, asset_type, createdAssets.length);
      const asset = await Asset.create({
        name: String(raw.name).trim(),
        asset_type,
        branch_id,
        asset_id,
        location: raw.location || null,
        purchase_value: raw.purchase_value ? parseFloat(raw.purchase_value) : null,
        po_number: raw.po_number || null,
        serial_number: raw.serial_number || null,
        supplier_id: raw.supplier_id ? parseInt(raw.supplier_id) : null,
        warranty_expiry: raw.warranty_expiry || null,
        created_by: req.user.id
      }, { transaction: t });
      createdAssets.push(asset);
    }
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  res.status(201).json({
    success: true,
    message: `${createdAssets.length} assets imported successfully${errors.length ? `, ${errors.length} rows skipped` : ''}`,
    data: {
      count: createdAssets.length,
      asset_ids: createdAssets.map(a => a.asset_id),
      errors
    }
  });
});
