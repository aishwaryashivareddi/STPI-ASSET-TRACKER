import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Disposal = sequelize.define('Disposal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  disposal_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  asset_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'assets', key: 'id' }
  },
  disposal_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  disposal_method: {
    type: DataTypes.ENUM('Sale', 'Scrap', 'Donation', 'Transfer', 'Auction', 'e-Waste'),
    allowNull: false
  },
  disposal_value: {
    type: DataTypes.DECIMAL(15, 2)
  },
  buyer_details: {
    type: DataTypes.TEXT
  },
  approval_document: {
    type: DataTypes.STRING(500)
  },
  disposal_certificate: {
    type: DataTypes.STRING(500)
  },
  reason: {
    type: DataTypes.TEXT
  },
  approved_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  approved_at: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Completed', 'Rejected'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'disposals',
  timestamps: true
});

export default Disposal;
