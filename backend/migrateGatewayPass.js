import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './models/index.js';

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS gateway_passes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gateway_pass_id VARCHAR(50) NOT NULL UNIQUE,
        asset_id INT NOT NULL,
        from_branch_id INT NOT NULL,
        to_branch_id INT NOT NULL,
        reason TEXT NOT NULL,
        transfer_date DATE NOT NULL,
        created_by INT,
        manager_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        manager_approved_by INT,
        manager_approved_at DATETIME,
        manager_remarks TEXT,
        admin_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        admin_approved_by INT,
        admin_approved_at DATETIME,
        admin_remarks TEXT,
        receiver_status ENUM('Pending', 'Received', 'Rejected') DEFAULT 'Pending',
        received_by INT,
        received_at DATETIME,
        receiver_remarks TEXT,
        status ENUM('Pending', 'Manager Approved', 'Admin Approved', 'Completed', 'Rejected') DEFAULT 'Pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (from_branch_id) REFERENCES branches(id),
        FOREIGN KEY (to_branch_id) REFERENCES branches(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (manager_approved_by) REFERENCES users(id),
        FOREIGN KEY (admin_approved_by) REFERENCES users(id),
        FOREIGN KEY (received_by) REFERENCES users(id)
      )
    `);

    console.log('gateway_passes table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
