import sequelize from './config/sequelize.js';

async function addResetTokenColumns() {
  try {
    console.log('Adding reset token columns to users table...');
    
    // Check if columns exist first
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('reset_token', 'reset_token_expiry');
    `);
    
    const existingColumns = results.map(r => r.COLUMN_NAME);
    
    if (!existingColumns.includes('reset_token')) {
      await sequelize.query(`ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);`);
      console.log('Added reset_token column');
    } else {
      console.log('reset_token column already exists');
    }
    
    if (!existingColumns.includes('reset_token_expiry')) {
      await sequelize.query(`ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME;`);
      console.log('Added reset_token_expiry column');
    } else {
      console.log('reset_token_expiry column already exists');
    }
    
    console.log('\nMigration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

addResetTokenColumns();
