import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Procurement = sequelize.define('Procurement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  procurement_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  asset_id: {
    type: DataTypes.INTEGER,
    references: { model: 'assets', key: 'id' }
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'branches', key: 'id' }
  },
  requisition_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  approval_status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  approved_at: {
    type: DataTypes.DATE
  },
  budget_allocated: {
    type: DataTypes.DECIMAL(15, 2)
  },
  vendor_selection_status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'),
    defaultValue: 'Pending'
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'procurements',
  timestamps: true
});

export default Procurement;
