import dotenv from 'dotenv';
dotenv.config();

import sequelize from './config/sequelize.js';

const log = (msg) => console.log(`  ✓ ${msg}`);
const skip = (msg) => console.log(`  - ${msg} (already exists)`);

const hasColumn = async (table, column) => {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return rows.length > 0;
};

const hasTable = async (table) => {
  const [rows] = await sequelize.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] }
  );
  return rows.length > 0;
};

const addColumn = async (table, column, definition, after = null) => {
  if (await hasColumn(table, column)) { skip(`${table}.${column}`); return; }
  const afterClause = after ? `AFTER ${after}` : '';
  await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition} ${afterClause}`);
  log(`Added ${table}.${column}`);
};

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('\n🔌 Database connected\n');

    // ─── 1. users: reset token columns ───────────────────────────────────────
    console.log('📋 [1/4] User reset token columns...');
    await addColumn('users', 'reset_token', 'VARCHAR(255) NULL');
    await addColumn('users', 'reset_token_expiry', 'DATETIME NULL');

    // ─── 2. gateway_passes table ─────────────────────────────────────────────
    console.log('\n📋 [2/4] Gateway passes table...');
    if (!(await hasTable('gateway_passes'))) {
      await sequelize.query(`
        CREATE TABLE gateway_passes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          gateway_pass_id VARCHAR(50) NOT NULL UNIQUE,
          asset_id INT NOT NULL,
          from_branch_id INT NOT NULL,
          to_branch_id INT NOT NULL,
          reason TEXT NOT NULL,
          transfer_date DATE NOT NULL,
          pass_through_person VARCHAR(100),
          prepared_by_person VARCHAR(100),
          authorized_by_person VARCHAR(100),
          received_by_person VARCHAR(100),
          created_by INT,
          status VARCHAR(20) NOT NULL DEFAULT 'Completed',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets(id),
          FOREIGN KEY (from_branch_id) REFERENCES branches(id),
          FOREIGN KEY (to_branch_id) REFERENCES branches(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);
      log('Created gateway_passes table');
    } else {
      skip('gateway_passes table');
      // Add any missing columns to existing table
      await addColumn('gateway_passes', 'pass_through_person', 'VARCHAR(100) NULL', 'transfer_date');
      await addColumn('gateway_passes', 'prepared_by_person', 'VARCHAR(100) NULL', 'pass_through_person');
      await addColumn('gateway_passes', 'authorized_by_person', 'VARCHAR(100) NULL', 'prepared_by_person');
      await addColumn('gateway_passes', 'received_by_person', 'VARCHAR(100) NULL', 'authorized_by_person');
    }

    // ─── 3. assets: serial_number ─────────────────────────────────────────────
    console.log('\n📋 [3/4] Asset columns...');
    await addColumn('assets', 'serial_number', 'VARCHAR(100) NULL');

    // ─── 4. users: registration fields ───────────────────────────────────────
    console.log('\n📋 [4/4] User registration columns...');
    await addColumn('users', 'full_name', 'VARCHAR(100) NULL', 'username');
    await addColumn('users', 'department', 'VARCHAR(100) NULL');
    await addColumn('users', 'registration_status', "VARCHAR(20) NOT NULL DEFAULT 'Approved'");

    console.log('\n✅ All migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
