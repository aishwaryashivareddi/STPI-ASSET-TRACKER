import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Manager', 'Auditor', 'Viewer', 'User'),
    defaultValue: 'Viewer'
  },
  branch_id: {
    type: DataTypes.INTEGER,
    references: { model: 'branches', key: 'id' }
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  registration_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Approved'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

export default User;
