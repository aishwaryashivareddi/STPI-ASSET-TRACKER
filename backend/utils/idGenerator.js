import { Asset, Branch } from '../models/index.js';
import { Op } from 'sequelize';

const ASSET_TYPE_CODES = {
  'HSDC': 'HD',
  'COMPUTER': 'CP',
  'ELECTRICAL': 'EL',
  'OFFICE': 'OF',
  'FURNITURE': 'FR',
  'FIREFIGHTING': 'FF',
  'BUILDING': 'BD'
};

/**
 * Generate unique asset ID in format: [BRANCHCODE][DD/MM/YY][ASSETTYPE+SEQUENTIALNUMBER]
 * Example: HYD010125HD001
 */
export const generateAssetId = async (branchId, assetType) => {
  const branch = await Branch.findByPk(branchId);
  if (!branch) throw new Error('Branch not found');

  const branchCode = branch.code.toUpperCase();
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const dateCode = `${day}${month}${year}`;
  
  const assetTypeCode = ASSET_TYPE_CODES[assetType];
  if (!assetTypeCode) throw new Error('Invalid asset type');

  const prefix = `${branchCode}${dateCode}${assetTypeCode}`;
  
  // Find the last asset with this prefix
  const lastAsset = await Asset.findOne({
    where: {
      asset_id: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['asset_id', 'DESC']]
  });

  let sequentialNumber = 1;
  if (lastAsset) {
    const lastSequence = parseInt(lastAsset.asset_id.slice(-3));
    sequentialNumber = lastSequence + 1;
  }

  const assetId = `${prefix}${String(sequentialNumber).padStart(3, '0')}`;
  return assetId;
};

/**
 * Generate procurement ID
 */
export const generateProcurementId = async (branchId) => {
  const branch = await Branch.findByPk(branchId);
  if (!branch) throw new Error('Branch not found');

  const branchCode = branch.code.toUpperCase();
  const date = new Date();
  const dateCode = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;
  
  const { Procurement } = await import('../models/index.js');
  const prefix = `${branchCode}${dateCode}PR`;
  
  const lastRecord = await Procurement.findOne({
    where: { procurement_id: { [Op.like]: `${prefix}%` } },
    order: [['procurement_id', 'DESC']]
  });

  let sequentialNumber = 1;
  if (lastRecord) {
    const lastSequence = parseInt(lastRecord.procurement_id.slice(-3));
    sequentialNumber = lastSequence + 1;
  }

  return `${prefix}${String(sequentialNumber).padStart(3, '0')}`;
};

/**
 * Generate maintenance ID
 */
export const generateMaintenanceId = async (branchId) => {
  const branch = await Branch.findByPk(branchId);
  if (!branch) throw new Error('Branch not found');

  const branchCode = branch.code.toUpperCase();
  const date = new Date();
  const dateCode = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;
  
  const { Maintenance } = await import('../models/index.js');
  const prefix = `${branchCode}${dateCode}MT`;
  
  const lastRecord = await Maintenance.findOne({
    where: { maintenance_id: { [Op.like]: `${prefix}%` } },
    order: [['maintenance_id', 'DESC']]
  });

  let sequentialNumber = 1;
  if (lastRecord) {
    const lastSequence = parseInt(lastRecord.maintenance_id.slice(-3));
    sequentialNumber = lastSequence + 1;
  }

  return `${prefix}${String(sequentialNumber).padStart(3, '0')}`;
};

/**
 * Generate disposal ID
 */
export const generateDisposalId = async (branchId) => {
  const branch = await Branch.findByPk(branchId);
  if (!branch) throw new Error('Branch not found');

  const branchCode = branch.code.toUpperCase();
  const date = new Date();
  const dateCode = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;
  
  const { Disposal } = await import('../models/index.js');
  const prefix = `${branchCode}${dateCode}DS`;
  
  const lastRecord = await Disposal.findOne({
    where: { disposal_id: { [Op.like]: `${prefix}%` } },
    order: [['disposal_id', 'DESC']]
  });

  let sequentialNumber = 1;
  if (lastRecord) {
    const lastSequence = parseInt(lastRecord.disposal_id.slice(-3));
    sequentialNumber = lastSequence + 1;
  }

  return `${prefix}${String(sequentialNumber).padStart(3, '0')}`;
};
