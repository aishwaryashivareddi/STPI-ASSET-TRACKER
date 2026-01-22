import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { sequelize, Branch, Supplier, User, Asset } from './models/index.js';
import { generateAssetId } from './utils/idGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  try {
    console.log('Starting database seeding...\n');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synced\n');

    // 1. Create Branches
    console.log('Creating branches...');
    const branches = await Branch.bulkCreate([
      { name: 'Hyderabad', code: 'HYD', address: 'Jubilee Hills, Hyderabad', is_active: true },
      { name: 'Bangalore', code: 'BLR', address: 'Bangalore', is_active: true },
      { name: 'Mumbai', code: 'MUM', address: 'Mumbai', is_active: true },
      { name: 'Delhi', code: 'DEL', address: 'Delhi', is_active: true }
    ]);
    console.log(`Created ${branches.length} branches\n`);

    // 2. Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const users = await User.bulkCreate([
      {
        username: 'admin',
        email: 'admin@stpi.in',
        password: hashedPassword,
        role: 'Admin',
        branch_id: branches[0].id,
        is_active: true
      },
      {
        username: 'manager_hyd',
        email: 'manager.hyd@stpi.in',
        password: hashedPassword,
        role: 'Manager',
        branch_id: branches[0].id,
        is_active: true
      },
      {
        username: 'user_hyd',
        email: 'user.hyd@stpi.in',
        password: hashedPassword,
        role: 'User',
        branch_id: branches[0].id,
        is_active: true
      }
    ]);
    console.log(`Created ${users.length} users\n`);

    // 3. Create Suppliers
    console.log('Creating suppliers...');
    const suppliersData = [
      { name: 'Wipro Infotech', contact_person: 'Sales Team', email: 'sales@wipro.com', phone: '1234567890' },
      { name: 'Aditya Infotech Pvt.Ltd', contact_person: 'Sales', email: 'sales@aditya.com', phone: '9876543210' },
      { name: 'Powerica Limited', contact_person: 'Support', email: 'support@powerica.com', phone: '1122334455' },
      { name: 'NPCC', contact_person: 'Admin', email: 'admin@npcc.com', phone: '5544332211' },
      { name: 'Kendiya Bandar', contact_person: 'Sales', email: 'sales@kendiya.com', phone: '9988776655' }
    ];
    
    const suppliers = await Supplier.bulkCreate(suppliersData);
    console.log(`Created ${suppliers.length} suppliers\n`);

    // 4. Load and seed assets from Excel data
    console.log('Loading assets from Excel data...');
    const assetsDataPath = path.join(__dirname, '../assets_seed_data.json');
    
    if (fs.existsSync(assetsDataPath)) {
      const assetsData = JSON.parse(fs.readFileSync(assetsDataPath, 'utf-8'));
      console.log(`Found ${assetsData.length} assets to import\n`);

      let importedCount = 0;
      let fixedCount = 0;

      // Map invalid asset types to valid ones
      const assetTypeMap = {
        'OTHER': 'OFFICE',
        'MOBILE': 'OFFICE',
        'CAMERA': 'OFFICE',
        'DATA CARD': 'OFFICE',
        'POCKET PC': 'COMPUTER',
        'WEIGHING MACHINE': 'OFFICE',
        'BP MONITOR': 'OFFICE',
        'IRON TROLLY': 'OFFICE',
        'PROJECT MODEL': 'OFFICE',
        'LUNCH TABLE': 'FURNITURE',
        'CEILING FANS': 'ELECTRICAL',
        'TENNIS TABLE': 'FURNITURE',
        'SATELLITE DISH': 'HSDC',
        'ROUND COFFEE TABLE': 'FURNITURE',
        'COMPUTER STAND': 'FURNITURE',
        'WOOD CUPBOARD': 'FURNITURE',
        'STEEL FILE RACK': 'FURNITURE',
        'NAME BOARD': 'OFFICE',
        'WRITING BOARD': 'OFFICE',
        'STEEL TABLE': 'FURNITURE',
        'QUOTATION BOX': 'OFFICE',
        'MARBLE TABLE': 'FURNITURE',
        'ROSE WOOD IDOL': 'OFFICE',
        'CONFERENCE TABLE': 'FURNITURE',
        'EPABX': 'HSDC',
        'HAND DRYER': 'ELECTRICAL',
        'HP SERVER': 'COMPUTER',
        'HP PRINTER': 'COMPUTER',
        'ALTUSEN': 'HSDC',
        'MROTEC': 'HSDC',
        'FIBRE MEDIA CONVERTER': 'HSDC',
        'ERICO': 'ELECTRICAL',
        'UPS SYSTEM': 'ELECTRICAL',
        'DVR': 'HSDC',
        'WALL FAN': 'ELECTRICAL',
        'TABLE FAN': 'ELECTRICAL'
      };

      // Map invalid status values to valid ones
      const statusMap = {
        'WORKING': 'Working',
        'NOT WORKING': 'Not Working',
        'OBSOLETE': 'Obsolete',
        'UNDER REPAIR': 'Under Repair',
        'DISPOSED': 'Disposed',
        'GOOD': 'Working',
        'BAD': 'Not Working',
        'DAMAGED': 'Not Working'
      };

      // Helper function to parse dates - FIXED for Node v22
      const parseDate = (dateStr) => {
        try {
          if (!dateStr || typeof dateStr !== 'string') {
            return null;
          }
          
          const normalized = String(dateStr).trim();
          
          if (['NA', 'Nil', 'Not available', 'N/A', '-', ''].includes(normalized)) {
            return null;
          }
          
          if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            return normalized;
          }
          
          const dateMatch = normalized.match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
          if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const parsedDay = parseInt(day, 10);
            const parsedMonth = parseInt(month, 10);
            const parsedYear = parseInt(year, 10);
            
            // Validate date ranges
            if (parsedDay < 1 || parsedDay > 31 || parsedMonth < 1 || parsedMonth > 12) {
              return null;
            }
            
            return `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
          }
          
          if (/^\d{4}$/.test(normalized)) {
            return `${normalized}-01-01`;
          }
        } catch (error) {
          console.log(`Date parse error for: ${dateStr}`);
          return null;
        }
        
        return null;
      };

      // Helper to fix asset type
      const fixAssetType = (type) => {
        if (!type) return 'OFFICE';
        const upperType = type.toUpperCase().trim();
        return assetTypeMap[upperType] || type;
      };

      // Helper to fix status
      const fixStatus = (status) => {
        if (!status) return 'Working';
        const upperStatus = status.toUpperCase().trim();
        return statusMap[upperStatus] || 'Working';
      };

      for (const assetData of assetsData) {
        try {
          // Fix asset type
          const fixedAssetType = fixAssetType(assetData.asset_type);
          const fixedStatus = fixStatus(assetData.current_status);
          
          // Find or create supplier
          let supplier = null;
          if (assetData.supplier_name) {
            supplier = await Supplier.findOne({ 
              where: { name: assetData.supplier_name } 
            });
            
            if (!supplier) {
              supplier = await Supplier.create({
                name: assetData.supplier_name,
                contact_person: 'N/A',
                email: null,
                phone: null
              });
            }
          }

          // Create individual assets based on quantity
          const quantity = assetData.quantity || 1;
          for (let i = 0; i < quantity; i++) {
            // Generate unique asset ID for each item
            const asset_id = await generateAssetId(assetData.branch_id, fixedAssetType);

            // Create individual asset
            await Asset.create({
              asset_id,
              asset_type: fixedAssetType,
              name: assetData.name,
              quantity: 1,
              branch_id: assetData.branch_id,
              location: assetData.location,
              serial_number: assetData.serial_number,
              ams_barcode: assetData.ams_barcode,
              supplier_id: supplier ? supplier.id : null,
              po_number: assetData.po_number,
              po_date: parseDate(assetData.po_date),
              invoice_date: parseDate(assetData.invoice_date),
              purchase_value: assetData.purchase_value,
              current_status: fixedStatus,
              book_stock: 1,
              physical_stock: 1,
              stock_difference: 0,
              remarks: assetData.remarks,
              testing_status: 'Pending',
              created_by: users[0].id
            });

            importedCount++;
            if (fixedAssetType !== assetData.asset_type || fixedStatus !== assetData.current_status) {
              fixedCount++;
            }
          }
          
          if (importedCount % 100 === 0) {
            console.log(`  Imported ${importedCount} assets...`);
          }
        } catch (error) {
          console.error(`  Error with asset: ${assetData.name} - ${error.message}`);
        }
      }

      console.log(`\nImported ${importedCount} assets`);
      if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} assets (corrected types/statuses)`);
      }
    } else {
      console.log('No assets data file found. Creating sample assets...\n');
      
      // Create sample assets
      const sampleAssets = [
        {
          asset_type: 'COMPUTER',
          name: 'Dell Laptop',
          quantity: 1,
          branch_id: branches[0].id,
          location: 'Office Floor 1',
          purchase_value: 45000,
          current_status: 'Working',
          supplier_id: suppliers[0].id
        },
        {
          asset_type: 'OFFICE',
          name: 'Office Chair',
          quantity: 10,
          branch_id: branches[0].id,
          location: 'Office Floor 2',
          purchase_value: 5000,
          current_status: 'Working',
          supplier_id: suppliers[1].id
        }
      ];

      for (const assetData of sampleAssets) {
        const asset_id = await generateAssetId(assetData.branch_id, assetData.asset_type);
        await Asset.create({
          ...assetData,
          asset_id,
          book_stock: assetData.quantity,
          physical_stock: assetData.quantity,
          stock_difference: 0,
          testing_status: 'Pending',
          created_by: users[0].id
        });
      }
      
      console.log(`Created ${sampleAssets.length} sample assets\n`);
    }

    console.log('\nDatabase seeding completed successfully!\n');
    console.log('Login credentials:');
    console.log('   Admin: admin@stpi.in / admin123');
    console.log('   Manager: manager.hyd@stpi.in / admin123');
    console.log('   User: user.hyd@stpi.in / admin123\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
