import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contact_person: {
    type: DataTypes.STRING(100)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.TEXT
  },
  email: {
    type: DataTypes.STRING(100)
  }
}, {
  tableName: 'suppliers',
  timestamps: true
});

export default Supplier;
