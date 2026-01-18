import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Maintenance = sequelize.define('Maintenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  maintenance_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  asset_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'assets', key: 'id' }
  },
  maintenance_type: {
    type: DataTypes.ENUM('Preventive', 'Corrective', 'Emergency'),
    allowNull: false
  },
  issue_description: {
    type: DataTypes.TEXT
  },
  scheduled_date: {
    type: DataTypes.DATEONLY
  },
  completed_date: {
    type: DataTypes.DATEONLY
  },
  cost: {
    type: DataTypes.DECIMAL(15, 2)
  },
  vendor_name: {
    type: DataTypes.STRING(255)
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled'),
    defaultValue: 'Scheduled'
  },
  maintenance_report_file: {
    type: DataTypes.STRING(500)
  },
  performed_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'maintenances',
  timestamps: true
});

export default Maintenance;
