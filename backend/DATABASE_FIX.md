# Database Fix Instructions

## Issues Fixed

1. ✅ **Foreign Key Constraint Errors** - Fixed primary key naming in Branch, User, and Supplier models
2. ✅ **Missing Model Fields** - Added `code` and `is_active` to Branch model
3. ✅ **Orphaned Tables** - Created cleanup script to drop `devices` and `categories` tables
4. ✅ **Model Consistency** - All models now use `id` as primary key

## Changes Made

### Models Updated:
- **Branch.js** - Changed `branch_id` → `id`, added `code` and `is_active` fields
- **User.js** - Changed `user_id` → `id`, fixed foreign key reference, added 'User' role
- **Supplier.js** - Changed `supplier_id` → `id`, updated field names

### New Files:
- **cleanupDatabase.js** - Script to drop orphaned tables safely

## Steps to Fix Your Database

### Step 1: Run Cleanup Script
```bash
cd backend
npm run cleanup
```

This will:
- Drop the orphaned `devices` table
- Drop the orphaned `categories` table
- Prepare database for fresh seeding

### Step 2: Seed Database
```bash
npm run seed
```

This will:
- Create all tables with correct schema
- Import 394 assets (if assets_seed_data.json exists)
- Create default users and branches

### Step 3: Start Backend Server
```bash
npm run dev
```

Server should start successfully on http://localhost:5000

## Verification

After running the above steps, you should see:

```
✅ Database connection established successfully
✅ Database tables created/verified
✅ Server running in development mode on port 5000
```

## Default Login Credentials

```
Admin:
  Email: admin@stpi.in
  Password: admin123

Manager (Hyderabad):
  Email: manager.hyd@stpi.in
  Password: admin123

User (Hyderabad):
  Email: user.hyd@stpi.in
  Password: admin123
```

## Troubleshooting

### If cleanup fails:
Manually drop tables using MySQL:
```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS disposals;
DROP TABLE IF EXISTS maintenances;
DROP TABLE IF EXISTS procurements;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS branches;
SET FOREIGN_KEY_CHECKS = 1;
```

Then run `npm run seed`

### If seeding fails:
1. Check MySQL is running
2. Verify database credentials in `.env`
3. Ensure database `stpi_asset_tracker` exists
4. Run cleanup script again

### If server won't start:
1. Check all models are using correct primary keys (`id`)
2. Verify foreign key references point to `id` not old column names
3. Check logs in `backend/logs/error.log`

## Database Schema Summary

All tables now use consistent naming:

| Table | Primary Key | Foreign Keys |
|-------|-------------|--------------|
| branches | id | - |
| suppliers | id | - |
| users | id | branch_id → branches(id) |
| assets | id | branch_id → branches(id), supplier_id → suppliers(id), tested_by → users(id), created_by → users(id) |
| procurements | id | asset_id → assets(id), branch_id → branches(id), created_by → users(id), approved_by → users(id) |
| maintenances | id | asset_id → assets(id), performed_by → users(id) |
| disposals | id | asset_id → assets(id), approved_by → users(id) |

## Next Steps

1. ✅ Run cleanup script
2. ✅ Run seed script
3. ✅ Start backend server
4. ✅ Start frontend (from project root): `npm run dev`
5. ✅ Access application at http://localhost:5173

## Support

If you encounter any issues:
1. Check backend logs: `backend/logs/error.log`
2. Check browser console for frontend errors
3. Verify both servers are running
4. Ensure MySQL is running and accessible
