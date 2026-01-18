# STPI Asset Tracker - Setup Guide for New Machine

This guide will help you set up the STPI Asset Tracker on a new machine after cloning from Git.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd STPI-ASSET-TRACKER
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd ..
npm install
```

### 3. Configure MySQL Database

#### Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE stpi_asset_tracker;

# Exit MySQL
exit;
```

### 4. Configure Environment Variables

#### Backend Configuration
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:
```env
PORT=5000
NODE_ENV=development

# Database - UPDATE THESE
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stpi_asset_tracker
DB_PORT=3306

# JWT - CHANGE IN PRODUCTION
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=24h

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:5173

# Sequelize
SEQUELIZE_SYNC=false

# Email (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@stpi.in
FRONTEND_URL=http://localhost:5173
```

### 5. Create Upload Directories

```bash
# From backend directory
mkdir -p uploads/invoices
mkdir -p uploads/po
mkdir -p uploads/dc
mkdir -p uploads/testing-reports
mkdir -p uploads/maintenance-reports
mkdir -p uploads/disposal-docs
```

Or use the provided script:
```bash
# Windows
cd backend
mkdir uploads\invoices uploads\po uploads\dc uploads\testing-reports uploads\maintenance-reports uploads\disposal-docs

# Linux/Mac
cd backend
mkdir -p uploads/{invoices,po,dc,testing-reports,maintenance-reports,disposal-docs}
```

### 6. Seed the Database

This will create all tables and import 394 assets:

```bash
cd backend
npm run seed
```

Expected output:
```
Starting database seeding...
Database synced
Creating branches...
Created 4 branches
Creating users...
Created 3 users
Creating suppliers...
Created 5 suppliers
Loading assets from Excel data...
Found 394 assets to import
...
Imported 394 assets
Database seeding completed successfully!
```

### 7. Run Password Reset Migration (Optional)

If you want password reset functionality:

```bash
cd backend
node migrateResetToken.js
```

### 8. Start the Application

#### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```

Backend will run on: http://localhost:5000

#### Start Frontend (Terminal 2)
```bash
# From project root
npm run dev
```

Frontend will run on: http://localhost:5173

### 9. Verify Installation

1. Open browser: http://localhost:5173
2. Login with default credentials:
   - Email: `admin@stpi.in`
   - Password: `admin123`
3. Check dashboard loads with statistics
4. Verify assets are imported (should show 394 assets)

## Default User Accounts

After seeding, you'll have these accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@stpi.in | admin123 | All branches, full permissions |
| Manager | manager.hyd@stpi.in | admin123 | Hyderabad branch, approvals |
| User | user.hyd@stpi.in | admin123 | Hyderabad branch, basic access |

**⚠️ IMPORTANT: Change these passwords in production!**

## Troubleshooting

### Database Connection Failed
```bash
# Check MySQL is running
# Windows: services.msc → MySQL
# Linux: sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SHOW DATABASES;"
```

### Port Already in Use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Seed fails with "Table already exists"
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS stpi_asset_tracker; CREATE DATABASE stpi_asset_tracker;"

# Run seed again
npm run seed
```

### Frontend can't connect to backend
1. Check backend is running on port 5000
2. Verify `CORS_ORIGIN` in backend/.env
3. Check `baseURL` in src/api.js

## Production Deployment

For production deployment, see:
- [README.md](README.md) - Production deployment section
- [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Deployment guide

## Quick Commands Reference

```bash
# Backend
cd backend
npm install              # Install dependencies
npm run seed            # Seed database
npm run dev             # Start development server
npm start               # Start production server

# Frontend
npm install             # Install dependencies
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
mysql -u root -p        # Login to MySQL
npm run seed            # Seed database
node migrateResetToken.js  # Add password reset fields
```

## File Structure After Setup

```
STPI-ASSET-TRACKER/
├── backend/
│   ├── node_modules/      ✅ Created by npm install
│   ├── uploads/           ✅ Created manually
│   ├── logs/              ✅ Created automatically
│   ├── .env               ✅ Created from .env.example
│   └── ...
├── node_modules/          ✅ Created by npm install
├── dist/                  ⚠️  Created by npm run build
└── ...
```

## What's Included in Git

✅ Source code (backend + frontend)
✅ Configuration examples (.env.example)
✅ Database seed script
✅ Asset data (assets_seed_data.json)
✅ Documentation files
✅ Package.json files

## What's NOT in Git (You Need to Create)

❌ .env files (contains secrets)
❌ node_modules/ (install with npm install)
❌ uploads/ folder (create manually)
❌ logs/ folder (created automatically)
❌ dist/ folder (created by build)

## Next Steps

1. ✅ Clone repository
2. ✅ Install dependencies
3. ✅ Configure database
4. ✅ Create .env file
5. ✅ Create upload folders
6. ✅ Seed database
7. ✅ Start servers
8. ✅ Login and verify

## Support

If you encounter issues:
1. Check this setup guide
2. Review [README.md](README.md)
3. Check [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)
4. Review backend logs: `backend/logs/error.log`
5. Check browser console for frontend errors

## Security Checklist for Production

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Update CORS_ORIGIN to production URL
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure proper database credentials
- [ ] Set up regular database backups
- [ ] Configure email service for password reset
- [ ] Review and update rate limiting
- [ ] Set up monitoring and logging

---

**Ready to start?** Follow the steps above and you'll have the system running in minutes!
