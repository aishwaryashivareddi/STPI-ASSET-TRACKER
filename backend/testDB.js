import pool from './config/database.js';

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('DB Connected:', rows[0].result); // should print 2
  } catch (err) {
    console.error('DB Connection Error:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
