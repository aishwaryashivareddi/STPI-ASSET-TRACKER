import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  asset_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Format: [BRANCHCODE][DD/MM/YY][ASSETTYPE+SEQUENTIALNUMBER]'
  },
  asset_type: {
    type: DataTypes.ENUM('HSDC', 'COMPUTER', 'ELECTRICAL', 'OFFICE', 'FURNITURE', 'FIREFIGHTING', 'BUILDING'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  serial_number: {
    type: DataTypes.STRING(100)
  },
  ams_barcode: {
    type: DataTypes.STRING(50)
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'branches', key: 'id' }
  },
  location: {
    type: DataTypes.STRING(255)
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    references: { model: 'suppliers', key: 'id' }
  },
  po_number: {
    type: DataTypes.STRING(100)
  },
  po_date: {
    type: DataTypes.DATEONLY
  },
  invoice_number: {
    type: DataTypes.STRING(100)
  },
  invoice_date: {
    type: DataTypes.DATEONLY
  },
  invoice_file: {
    type: DataTypes.STRING(500),
    comment: 'File path for invoice PDF/image'
  },
  dc_file: {
    type: DataTypes.STRING(500),
    comment: 'Delivery challan file path'
  },
  po_file: {
    type: DataTypes.STRING(500),
    comment: 'Purchase order file path'
  },
  purchase_value: {
    type: DataTypes.DECIMAL(15, 2)
  },
  current_status: {
    type: DataTypes.ENUM('Working', 'Not Working', 'Obsolete', 'Under Repair', 'Disposed'),
    defaultValue: 'Working'
  },
  book_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  physical_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  stock_difference: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  remarks: {
    type: DataTypes.TEXT
  },
  testing_status: {
    type: DataTypes.ENUM('Pending', 'Passed', 'Failed'),
    defaultValue: 'Pending'
  },
  testing_report_file: {
    type: DataTypes.STRING(500)
  },
  tested_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  tested_at: {
    type: DataTypes.DATE
  },
  warranty_expiry: {
    type: DataTypes.DATEONLY
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'assets',
  timestamps: true,
  indexes: [
    { fields: ['asset_id'] },
    { fields: ['asset_type'] },
    { fields: ['branch_id'] },
    { fields: ['current_status'] },
    { fields: ['ams_barcode'] }
  ]
});

export default Asset;
