import sequelize from '../config/sequelize.js';
import Branch from './Branch.js';
import Supplier from './Supplier.js';
import User from './User.js';
import Asset from './Asset.js';
import Procurement from './Procurement.js';
import Maintenance from './Maintenance.js';
import Disposal from './Disposal.js';

// Branch associations
Branch.hasMany(Asset, { foreignKey: 'branch_id', onDelete: 'RESTRICT' });
Branch.hasMany(Procurement, { foreignKey: 'branch_id', onDelete: 'RESTRICT' });
Branch.hasMany(User, { foreignKey: 'branch_id', onDelete: 'SET NULL' });

// Supplier associations
Supplier.hasMany(Asset, { foreignKey: 'supplier_id', onDelete: 'SET NULL' });

// User associations
User.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
User.hasMany(Asset, { foreignKey: 'created_by', as: 'createdAssets' });
User.hasMany(Asset, { foreignKey: 'tested_by', as: 'testedAssets' });
User.hasMany(Procurement, { foreignKey: 'created_by', as: 'createdProcurements' });
User.hasMany(Maintenance, { foreignKey: 'performed_by', as: 'performedMaintenances' });

// Asset associations
Asset.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
Asset.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Asset.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Asset.belongsTo(User, { foreignKey: 'tested_by', as: 'tester' });
Asset.hasMany(Maintenance, { foreignKey: 'asset_id', onDelete: 'CASCADE' });
Asset.hasOne(Procurement, { foreignKey: 'asset_id', onDelete: 'SET NULL' });
Asset.hasOne(Disposal, { foreignKey: 'asset_id', onDelete: 'CASCADE' });

// Procurement associations
Procurement.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
Procurement.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
Procurement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Procurement.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Maintenance associations
Maintenance.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
Maintenance.belongsTo(User, { foreignKey: 'performed_by', as: 'performer' });

// Disposal associations
Disposal.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
Disposal.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

export {
  sequelize,
  Branch,
  Supplier,
  User,
  Asset,
  Procurement,
  Maintenance,
  Disposal
};
