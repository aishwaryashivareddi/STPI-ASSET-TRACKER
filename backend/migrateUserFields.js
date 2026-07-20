import dotenv from 'dotenv';
dotenv.config();
import sequelize from './config/sequelize.js';

const migrate = async () => {
  await sequelize.authenticate();
  const [cols] = await sequelize.query('SHOW COLUMNS FROM users');
  const fields = cols.map(c => c.Field);
  console.log('Current columns:', fields.join(', '));

  if (!fields.includes('full_name')) {
    await sequelize.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(100) NULL AFTER username');
    console.log('Added full_name');
  }
  if (!fields.includes('department')) {
    await sequelize.query('ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL');
    console.log('Added department');
  }
  if (!fields.includes('registration_status')) {
    await sequelize.query("ALTER TABLE users ADD COLUMN registration_status VARCHAR(20) NOT NULL DEFAULT 'Approved'");
    console.log('Added registration_status');
  }
  console.log('Migration complete');
  process.exit(0);
};

migrate().catch(e => { console.error(e.message); process.exit(1); });
