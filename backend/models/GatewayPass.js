import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const GatewayPass = sequelize.define('GatewayPass', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  gateway_pass_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  asset_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'assets', key: 'id' }
  },
  from_branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'branches', key: 'id' }
  },
  to_branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'branches', key: 'id' }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  transfer_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  // Level 1 - Manager Approval
  manager_status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  manager_approved_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  manager_approved_at: {
    type: DataTypes.DATE
  },
  manager_remarks: {
    type: DataTypes.TEXT
  },
  // Level 2 - Admin Approval
  admin_status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  admin_approved_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  admin_approved_at: {
    type: DataTypes.DATE
  },
  admin_remarks: {
    type: DataTypes.TEXT
  },
  // Level 3 - Receiver Confirmation
  receiver_status: {
    type: DataTypes.ENUM('Pending', 'Received', 'Rejected'),
    defaultValue: 'Pending'
  },
  received_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  received_at: {
    type: DataTypes.DATE
  },
  receiver_remarks: {
    type: DataTypes.TEXT
  },
  // Overall status
  status: {
    type: DataTypes.ENUM('Pending', 'Manager Approved', 'Admin Approved', 'Completed', 'Rejected'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'gateway_passes',
  timestamps: true,
  underscored: false,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default GatewayPass;
