import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './models/index.js';

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const [columns] = await sequelize.query(`SHOW COLUMNS FROM gateway_passes LIKE 'pass_through_person'`);
    if (columns.length === 0) {
      await sequelize.query(`ALTER TABLE gateway_passes ADD COLUMN pass_through_person VARCHAR(100) AFTER transfer_date`);
      await sequelize.query(`ALTER TABLE gateway_passes ADD COLUMN prepared_by_person VARCHAR(100) AFTER pass_through_person`);
      await sequelize.query(`ALTER TABLE gateway_passes ADD COLUMN authorized_by_person VARCHAR(100) AFTER prepared_by_person`);
      console.log('Added pass_through_person, prepared_by_person, authorized_by_person columns.');
    } else {
      console.log('Columns already exist, skipping.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
