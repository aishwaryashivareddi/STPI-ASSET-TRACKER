# STPI Asset Tracker - Full Stack Application

Complete asset tracking system with React frontend and Node.js backend.

## Features

✅ **Asset Management** - Full lifecycle tracking with auto-generated IDs  
✅ **Procurement** - Request and approval workflow  
✅ **Maintenance** - Track repairs and servicing  
✅ **Disposal** - Approval-based disposal process  
✅ **File Uploads** - Invoices, PO, DC, Testing Reports  
✅ **RBAC** - Admin, Manager, User roles  
✅ **Multi-Branch** - Support for multiple locations  
✅ **394 Assets** - Pre-imported from Excel data  
✅ **React UI** - Modern responsive interface  
✅ **Forgot Password** - Secure password reset with token expiration

## Quick Start

### Backend Setup
```bash
cd backend
npm install

# Configure database
cp .env.example .env
# Edit .env with your MySQL credentials

# Seed database (creates tables + imports 394 assets)
npm run seed

# Run forgot password migration (adds reset token fields)
node migrateResetToken.js

# Start backend server
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup
```bash
# From project root
npm install

# Start frontend
npm run dev
```

Frontend runs on: http://localhost:5173

## Default Login Credentials

```
Admin:
  Email: admin@stpi.in
  Password: admin123
  Access: All branches, full permissions

Manager (Hyderabad):
  Email: manager.hyd@stpi.in
  Password: admin123
  Access: Hyderabad branch, testing & procurement approval

User (Hyderabad):
  Email: user.hyd@stpi.in
  Password: admin123
  Access: Hyderabad branch, view & create only
```

## Application Features

### Dashboard
- Asset statistics (Total, Working, Not Working, Obsolete)
- Maintenance statistics
- Assets by type breakdown
- Quick navigation to all modules

### Assets Module
- List all assets with filters (Type, Status)
- Create new assets with file uploads
- Auto-generated Asset IDs: `[BRANCHCODE][DD/MM/YY][ASSETTYPE+SEQ]`
- Testing confirmation (Admin/Manager only)
- View asset details

### Procurement Module
- Create procurement requests
- View all procurement requests
- Approve/Reject requests (Admin/Manager only)
- Track approval status

### Maintenance Module
- Create maintenance records
- Schedule maintenance
- Complete maintenance tasks
- Track maintenance history

### Disposal Module
- Create disposal requests
- Approve/Reject disposals (Admin only)
- Track disposal status
- Multiple disposal methods (Auction, Scrap, Donation, e-Waste)

## Asset ID Format

Auto-generated: `[BRANCHCODE][DD/MM/YY][ASSETTYPE+SEQ]`

Examples:
- `HYD010125HD001` - Hyderabad, 01/01/25, HSDC Equipment, #001
- `BLR150125CP042` - Bangalore, 15/01/25, Computer, #042

Asset Type Codes:
- HD = HSDC Equipment
- CP = Computer
- EL = Electrical
- OF = Office
- FR = Furniture
- FF = Fire-Fighting
- BD = Building

## API Endpoints

### Assets
```
GET    /api/assets              - List assets
POST   /api/assets              - Create asset (with file upload)
POST   /api/assets/:id/testing  - Confirm testing (Admin/Manager)
GET    /api/assets/stats        - Statistics
```

### Procurement
```
GET    /api/procurements                - List procurements
POST   /api/procurements                - Create request
POST   /api/procurements/:id/approve    - Approve (Admin/Manager)
```

### Maintenance
```
GET    /api/maintenances                - List maintenances
POST   /api/maintenances                - Create record
POST   /api/maintenances/:id/complete   - Complete maintenance
```

### Disposal
```
GET    /api/disposals              - List disposals
POST   /api/disposals              - Create request
POST   /api/disposals/:id/approve  - Approve (Admin only)
```

## RBAC Matrix

| Action | Admin | Manager | User |
|--------|-------|---------|------|
| View Assets | All Branches | Own Branch | Own Branch |
| Create/Edit | ✅ | ✅ | ✅ |
| Confirm Testing | ✅ | ✅ | ❌ |
| Approve Procurement | ✅ | ✅ | ❌ |
| Approve Disposal | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |

## Technology Stack

### Frontend
- React 18
- React Router DOM
- Axios
- CSS3

### Backend
- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- Multer (File uploads)

## Database Schema

**Core Tables:**
- `assets` - Main asset tracking
- `procurements` - Procurement workflow
- `maintenances` - Maintenance records
- `disposals` - Disposal management
- `branches` - Multi-branch support
- `suppliers` - Vendor management
- `users` - Authentication & RBAC

## Production Deployment

### Environment Variables (Backend)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stpi_asset_tracker
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Build Frontend
```bash
npm run build
```

### PM2 Process Manager
```bash
npm install -g pm2
cd backend
pm2 start server.js --name stpi-asset-tracker
pm2 startup
pm2 save
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploaded files
    location /uploads {
        alias /path/to/backend/uploads;
    }
}
```

## Security Features

- JWT authentication (24h expiration)
- Password hashing (bcrypt)
- Forgot password with secure tokens (1h expiration)
- Rate limiting (100 req/15min)
- Input validation & sanitization
- File upload validation (10MB limit)
- CORS configuration
- Security headers (Helmet)
- Protected routes (Frontend & Backend)

## Documentation

- **API Docs**: http://localhost:5000/api-docs (Swagger)
- **Health Check**: http://localhost:5000/api/health
- **Logs**: `backend/logs/`
- **Forgot Password**: See `FORGOT_PASSWORD_QUICKSTART.md` for setup and testing

## Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify database credentials in `.env`
- Run `npm run seed` to create tables

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check CORS settings in backend
- Verify API_URL in `src/api.js`

### Login fails
- Ensure database is seeded
- Check default credentials
- Verify JWT_SECRET is set

## Support

For issues:
- Check backend logs: `backend/logs/error.log`
- Check browser console for frontend errors
- Verify both servers are running

## Project Structure

```
STP-ASSET-TRACKER/
├── backend/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, validation, error handling
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Helper functions
│   ├── validators/         # Input validation
│   ├── uploads/            # File storage
│   └── server.js           # Entry point
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── utils/              # Helper functions
│   ├── api.js              # API client
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── DATABASE_ER_DIAGRAM.md  # Database schema diagram
├── APPLICATION_FLOW_DIAGRAM.md  # Application flow
├── TECHNICAL_DOCUMENTATION.md   # Technical details
├── RBAC_IMPLEMENTATION.md  # RBAC documentation
└── README.md               # This file
```

## Additional Documentation

- **[Database ER Diagram](DATABASE_ER_DIAGRAM.md)** - Complete database schema and relationships
- **[Application Flow Diagram](APPLICATION_FLOW_DIAGRAM.md)** - System architecture and workflows
- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Detailed technical implementation
- **[RBAC Implementation](RBAC_IMPLEMENTATION.md)** - Role-based access control guide

## Excel Data Import

The system includes 394 pre-imported assets from Excel:
- Parsed using Python (openpyxl/pandas)
- Converted to JSON format
- Imported during database seeding
- Includes 7 asset categories

## Key Features Explained

### Auto-Generated Asset IDs
Unique IDs are automatically generated using:
- Branch code (3 chars)
- Date (DDMMYY format)
- Asset type code (2 chars)
- Sequential number (3 digits)

### File Upload System
Supports multiple file types:
- Invoices, Purchase Orders, Delivery Challans
- Testing Reports, Maintenance Reports
- Disposal Documents
- Max size: 10MB per file

### Branch Isolation
Non-admin users are restricted to their branch:
- Data filtering at database level
- Automatic branch_id filtering
- Prevents cross-branch data access

### Approval Workflows
- **Procurement**: Admin/Manager approval required
- **Disposal**: Admin-only approval
- **Testing**: Admin/Manager confirmation
- Audit trail with approved_by and approved_at

## Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Development Commands
```bash
# Backend
cd backend
npm run dev          # Start with nodemon
npm run seed         # Seed database
npm test             # Run tests

# Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build
```

### Environment Setup
1. Clone repository
2. Install dependencies (backend + frontend)
3. Configure MySQL database
4. Copy `.env.example` to `.env`
5. Run database seeding
6. Start both servers

## Testing

### Test User Accounts
Three test accounts are created during seeding:
- **Admin**: Full system access
- **Manager**: Branch-level management
- **User**: Basic operations only

All use password: `admin123`

### Testing Workflows
1. **Asset Creation**: Create → Test → Approve
2. **Procurement**: Request → Review → Approve/Reject
3. **Maintenance**: Schedule → Perform → Complete
4. **Disposal**: Request → Admin Approval → Dispose

## Performance

- **Pagination**: 20 items per page (configurable)
- **Search**: Debounced (500ms delay)
- **Caching**: Response compression enabled
- **Database**: Indexed foreign keys
- **File Storage**: Local filesystem (uploads/)

## Security Best Practices

1. **Never commit** `.env` file
2. **Change default passwords** in production
3. **Use strong JWT_SECRET** (32+ characters)
4. **Enable HTTPS** in production
5. **Regular backups** of database
6. **Update dependencies** regularly
7. **Monitor logs** for suspicious activity

## Common Issues & Solutions

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Database Connection Error
```bash
# Check MySQL service
# Windows: services.msc
# Linux: sudo systemctl status mysql

# Test connection
mysql -u root -p
```

### CORS Error
Verify `CORS_ORIGIN` in backend `.env` matches frontend URL

### File Upload Fails
Check:
- File size < 10MB
- File type is allowed
- `uploads/` folder exists and has write permissions

## Roadmap

- [ ] Asset transfer between branches
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Barcode scanning
- [ ] Asset depreciation calculation
- [ ] Bulk operations
- [ ] Export to Excel/PDF

## Contributing

For internal STPI development team only.

## Support

**Technical Issues:**
- Check documentation files
- Review logs: `backend/logs/`
- Verify environment configuration

**Contact:**
STPI Development Team

## License

Proprietary - STPI

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained by:** STPI Development Team
