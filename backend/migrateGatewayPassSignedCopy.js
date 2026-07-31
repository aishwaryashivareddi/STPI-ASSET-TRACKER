import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './models/index.js';

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const [columns] = await sequelize.query(`SHOW COLUMNS FROM gateway_passes LIKE 'signed_copy'`);
    if (columns.length === 0) {
      await sequelize.query(`ALTER TABLE gateway_passes ADD COLUMN signed_copy VARCHAR(500) NULL AFTER received_by_person`);
      console.log('Added signed_copy column.');
    } else {
      console.log('signed_copy column already exists, skipping.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
