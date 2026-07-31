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
  pass_through_person: {
    type: DataTypes.STRING(100)
  },
  prepared_by_person: {
    type: DataTypes.STRING(100)
  },
  authorized_by_person: {
    type: DataTypes.STRING(100)
  },
  received_by_person: {
    type: DataTypes.STRING(100)
  },
  signed_copy: {
    type: DataTypes.STRING(500)
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('Completed'),
    defaultValue: 'Completed'
  }
}, {
  tableName: 'gateway_passes',
  timestamps: true,
  underscored: false,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default GatewayPass;
