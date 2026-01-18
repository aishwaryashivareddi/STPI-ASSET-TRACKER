import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDatabase() {
  let connection;
  
  try {
    console.log('Connecting to database...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'stpi_asset_tracker'
    });

    console.log('Connected to database\n');

    // Disable foreign key checks
    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all tables in database
    console.log('Finding all tables in database...');
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [process.env.DB_NAME || 'stpi_asset_tracker']
    );
    
    console.log(`Found ${tables.length} tables\n`);
    
    // Drop all tables
    console.log('Dropping all tables...');
    
    for (const { TABLE_NAME } of tables) {
      try {
        await connection.query(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);
        console.log(`   Dropped table: ${TABLE_NAME}`);
      } catch (error) {
        console.log(`   Could not drop ${TABLE_NAME}: ${error.message}`);
      }
    }

    // Re-enable foreign key checks
    console.log('\nRe-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\nDatabase cleanup completed successfully!\n');
    console.log('Next steps:');
    console.log('   1. Run: npm run seed');
    console.log('   2. Run: npm run dev\n');

  } catch (error) {
    console.error('Error cleaning up database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed\n');
    }
  }
}

cleanupDatabase();
