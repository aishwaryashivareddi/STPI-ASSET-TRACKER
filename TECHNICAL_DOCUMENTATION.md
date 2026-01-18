# STPI Asset Tracker - Technical Documentation

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Backend Technical Details](#backend-technical-details)
4. [Frontend Technical Details](#frontend-technical-details)
5. [Database Design](#database-design)
6. [Security Implementation](#security-implementation)
7. [API Documentation](#api-documentation)
8. [File Upload System](#file-upload-system)
9. [ID Generation System](#id-generation-system)
10. [Deployment Guide](#deployment-guide)

---

## Technology Stack

### Backend
```
Runtime:        Node.js v18+
Framework:      Express.js v4.18
ORM:            Sequelize v6.35
Database:       MySQL 8.0
Authentication: JWT (jsonwebtoken)
Password Hash:  bcrypt
Validation:     express-validator
File Upload:    Multer
Email:          Nodemailer
Logging:        Winston
API Docs:       Swagger UI
```

### Frontend
```
Framework:      React 18
Router:         React Router DOM v6
HTTP Client:    Axios
Styling:        CSS3 (Custom)
Build Tool:     Vite
```

### Development Tools
```
Package Manager: npm
Version Control: Git
Code Style:     ESLint
Environment:    dotenv
```

---

## Architecture Overview

### Design Pattern
**MVC (Model-View-Controller) + Service Layer**

```
┌─────────────────────────────────────────────────────────┐
│                    ARCHITECTURE LAYERS                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Presentation Layer (React)                              │
│  ├── Components (UI)                                     │
│  ├── State Management (useState, useEffect)              │
│  └── API Client (Axios)                                  │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  API Layer (Express)                                     │
│  ├── Routes (URL mapping)                                │
│  ├── Middleware (Auth, Validation, Error Handling)       │
│  └── Controllers (Request handling)                      │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Business Logic Layer                                    │
│  ├── Services (Business rules)                           │
│  ├── Validators (Input validation)                       │
│  └── Utils (Helper functions)                            │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Data Access Layer (Sequelize)                           │
│  ├── Models (Database schema)                            │
│  ├── Associations (Relationships)                        │
│  └── Migrations (Schema changes)                         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Database Layer (MySQL)                                  │
│  └── Tables, Indexes, Constraints                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Technical Details

### Project Structure
```
backend/
├── config/
│   ├── database.js          # Database connection config
│   ├── sequelize.js         # Sequelize instance
│   ├── logger.js            # Winston logger config
│   └── swagger.js           # Swagger API documentation
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── assetController.js   # Asset CRUD operations
│   ├── procurementController.js
│   ├── maintenanceController.js
│   ├── disposalController.js
│   └── masterController.js  # Branches, Suppliers
├── middleware/
│   ├── auth.js              # JWT authentication & RBAC
│   ├── errorHandler.js      # Global error handler
│   └── fileUpload.js        # Multer file upload config
├── models/
│   ├── index.js             # Model aggregator
│   ├── User.js              # User model
│   ├── Branch.js            # Branch model
│   ├── Supplier.js          # Supplier model
│   ├── Asset.js             # Asset model
│   ├── Procurement.js       # Procurement model
│   ├── Maintenance.js       # Maintenance model
│   └── Disposal.js          # Disposal model
├── routes/
│   ├── authRoutes.js        # /api/auth/*
│   ├── assetRoutes.js       # /api/assets/*
│   ├── procurementRoutes.js # /api/procurements/*
│   ├── maintenanceRoutes.js # /api/maintenances/*
│   ├── disposalRoutes.js    # /api/disposals/*
│   └── masterRoutes.js      # /api/master/*
├── services/
│   └── emailService.js      # Email sending service
├── utils/
│   ├── ApiResponse.js       # Standardized API responses
│   ├── AppError.js          # Custom error class
│   ├── catchAsync.js        # Async error wrapper
│   └── idGenerator.js       # Asset ID generation
├── validators/
│   ├── authValidator.js     # Auth input validation
│   └── assetValidator.js    # Asset input validation
├── uploads/                 # File storage directory
│   ├── invoices/
│   ├── po/
│   ├── dc/
│   ├── testing-reports/
│   ├── maintenance-reports/
│   └── disposal-docs/
├── logs/                    # Application logs
│   ├── all.log
│   └── error.log
├── .env                     # Environment variables
├── server.js                # Application entry point
├── seedDatabase.js          # Database seeding script
└── package.json             # Dependencies
```

### Key Backend Components

#### 1. Authentication Middleware (`middleware/auth.js`)
```javascript
// JWT Token Verification
export const authenticate = catchAsync(async (req, res, next) => {
  // 1. Extract token from Authorization header
  // 2. Verify JWT signature and expiration
  // 3. Load user from database
  // 4. Check user is active
  // 5. Attach user to req.user
  // 6. Call next()
});

// Role-Based Authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied', 403));
    }
    next();
  };
};
```

#### 2. Error Handler (`middleware/errorHandler.js`)
```javascript
// Global error handling middleware
export default (err, req, res, next) => {
  // Log error
  // Determine error type (operational vs programming)
  // Send appropriate response
  // Hide sensitive info in production
};
```

#### 3. API Response Utility (`utils/ApiResponse.js`)
```javascript
// Standardized response format
{
  status: 'success' | 'error',
  message: string,
  data: object | array,
  statusCode: number
}
```

#### 4. Asset ID Generator (`utils/idGenerator.js`)
```javascript
// Format: [BRANCHCODE][DDMMYY][ASSETTYPE+SEQ]
// Example: HYD010125CP001
// 
// Algorithm:
// 1. Get branch code (3 chars)
// 2. Get current date (DDMMYY)
// 3. Get asset type code (2 chars)
// 4. Query last sequence for today
// 5. Increment sequence (001, 002, ...)
// 6. Combine all parts
```

---

## Frontend Technical Details

### Project Structure
```
src/
├── components/
│   └── Pagination.jsx       # Reusable pagination component
├── utils/
│   └── fileValidation.js    # File upload validation
├── api.js                   # Axios API client
├── App.jsx                  # Main app component & routing
├── Login.jsx                # Login page
├── ForgotPassword.jsx       # Password reset request
├── ResetPassword.jsx        # Password reset form
├── Dashboard.jsx            # Dashboard with statistics
├── Assets.jsx               # Asset management
├── Procurements.jsx         # Procurement management
├── Maintenances.jsx         # Maintenance management
├── Disposals.jsx            # Disposal management
├── ErrorBoundary.jsx        # Error boundary component
├── index.css                # Global styles
└── main.jsx                 # React entry point
```

### Key Frontend Components

#### 1. API Client (`api.js`)
```javascript
// Axios instance with interceptors
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: Add JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

#### 2. Protected Routes
```javascript
// Check authentication on component mount
useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!token || !userData) {
    navigate('/');
    return;
  }
  setUser(userData);
}, [navigate]);
```

#### 3. Role-Based UI
```javascript
// Show/hide elements based on user role
const canApprove = user?.role === 'Admin' || user?.role === 'Manager';

{canApprove && (
  <button onClick={handleApprove}>Approve</button>
)}
```

#### 4. Pagination Component
```javascript
// Reusable pagination with page navigation
<Pagination 
  currentPage={pagination.page} 
  totalPages={pagination.totalPages} 
  onPageChange={(page) => setPagination({ ...pagination, page })} 
/>
```

---

## Database Design

### Sequelize Models

#### User Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  username: STRING(50) UNIQUE NOT NULL,
  email: STRING(100) UNIQUE NOT NULL,
  password: STRING(255) NOT NULL,
  role: ENUM('Admin','Manager','Auditor','Viewer','User'),
  branch_id: INTEGER (FK → branches.id),
  reset_token: STRING(255),
  reset_token_expiry: DATE,
  is_active: BOOLEAN DEFAULT true,
  timestamps: true
}
```

#### Asset Model
```javascript
{
  id: INTEGER (PK, Auto-increment),
  asset_id: STRING(50) UNIQUE NOT NULL,
  name: STRING(255) NOT NULL,
  asset_type: ENUM('HSDC','COMPUTER','ELECTRICAL','OFFICE','FURNITURE','FIREFIGHTING'),
  quantity: INTEGER DEFAULT 1,
  branch_id: INTEGER (FK → branches.id),
  location: STRING(255),
  serial_number: STRING(100),
  ams_barcode: STRING(100),
  supplier_id: INTEGER (FK → suppliers.id),
  po_number: STRING(100),
  po_date: DATE,
  po_file: STRING(255),
  dc_file: STRING(255),
  invoice_date: DATE,
  invoice_file: STRING(255),
  purchase_value: DECIMAL(15,2),
  current_status: ENUM('Working','Not Working','Obsolete','Under Repair','Disposed'),
  book_stock: INTEGER,
  physical_stock: INTEGER,
  stock_difference: INTEGER,
  testing_status: ENUM('Pending','Passed','Failed'),
  testing_report_file: STRING(255),
  remarks: TEXT,
  created_by: INTEGER (FK → users.id),
  updated_by: INTEGER (FK → users.id),
  tested_by: INTEGER (FK → users.id),
  tested_at: DATE,
  timestamps: true
}
```

### Model Associations
```javascript
// User ↔ Branch
User.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
Branch.hasMany(User, { foreignKey: 'branch_id', as: 'users' });

// Asset ↔ Branch
Asset.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
Branch.hasMany(Asset, { foreignKey: 'branch_id', as: 'assets' });

// Asset ↔ Supplier
Asset.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Asset, { foreignKey: 'supplier_id', as: 'assets' });

// Asset ↔ User (created_by, updated_by, tested_by)
Asset.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Asset.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });
Asset.belongsTo(User, { foreignKey: 'tested_by', as: 'tester' });
```

---

## Security Implementation

### 1. Authentication
- **JWT Tokens**: 24-hour expiration
- **Token Storage**: localStorage (client-side)
- **Token Transmission**: Authorization header (Bearer scheme)
- **Token Verification**: Every protected route

### 2. Password Security
- **Hashing Algorithm**: bcrypt with 10 salt rounds
- **Password Reset**: Crypto-generated tokens (32 bytes)
- **Token Expiration**: 1 hour for reset tokens
- **Validation**: Minimum 6 characters

### 3. Authorization (RBAC)
- **Roles**: Admin, Manager, User
- **Middleware**: `authorize([roles])`
- **Branch Isolation**: Non-admin users see only their branch data
- **Permission Checks**: Both frontend and backend

### 4. Input Validation
- **express-validator**: Request body validation
- **File Upload**: Type and size validation (10MB max)
- **SQL Injection**: Prevented by Sequelize ORM (parameterized queries)
- **XSS**: Sanitized inputs

### 5. Security Headers
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configured origin whitelist
- **Rate Limiting**: 100 requests per 15 minutes

### 6. Error Handling
- **Production Mode**: Hide stack traces
- **Development Mode**: Detailed error messages
- **Logging**: Winston logger (all.log, error.log)

---

## API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production:  https://yourdomain.com/api
```

### Authentication Endpoints

#### POST /api/auth/login
```javascript
Request:
{
  "email": "admin@stpi.in",
  "password": "admin123"
}

Response:
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@stpi.in",
      "role": "Admin",
      "branch_id": 1
    }
  }
}
```

#### POST /api/auth/forgot-password
```javascript
Request:
{
  "email": "admin@stpi.in"
}

Response:
{
  "status": "success",
  "message": "Password reset link sent to your email"
}
```

### Asset Endpoints

#### GET /api/assets
```javascript
Query Parameters:
- branch_id: number (optional)
- asset_type: string (optional)
- current_status: string (optional)
- search: string (optional)
- sortBy: string (default: 'created_at')
- sortOrder: 'ASC' | 'DESC' (default: 'DESC')
- page: number (default: 1)
- limit: number (default: 20)

Response:
{
  "status": "success",
  "data": {
    "assets": [...],
    "pagination": {
      "total": 394,
      "page": 1,
      "limit": 20,
      "totalPages": 20
    }
  }
}
```

#### POST /api/assets
```javascript
Request (multipart/form-data):
{
  "name": "Dell Laptop",
  "asset_type": "COMPUTER",
  "branch_id": 1,
  "quantity": 1,
  "location": "Office Floor 1",
  "purchase_value": 45000,
  "po_number": "PO123",
  "supplier_id": 1,
  "invoice_file": <file>,
  "po_file": <file>
}

Response:
{
  "status": "success",
  "message": "Asset created successfully",
  "data": {
    "id": 1,
    "asset_id": "HYD010125CP001",
    ...
  }
}
```

#### POST /api/assets/:id/testing (Admin/Manager only)
```javascript
Request (multipart/form-data):
{
  "testing_status": "Passed",
  "remarks": "All tests passed",
  "testing_report_file": <file>
}

Response:
{
  "status": "success",
  "message": "Testing status updated successfully"
}
```

### Procurement Endpoints

#### POST /api/procurements
```javascript
Request:
{
  "branch_id": 1,
  "requisition_date": "2025-01-15",
  "budget_allocated": 100000
}

Response:
{
  "status": "success",
  "message": "Procurement request created",
  "data": {
    "id": 1,
    "procurement_id": "PROC-HYD-001",
    "approval_status": "Pending",
    ...
  }
}
```

#### POST /api/procurements/:id/approve (Admin/Manager only)
```javascript
Request:
{
  "approval_status": "Approved"
}

Response:
{
  "status": "success",
  "message": "Procurement status updated"
}
```

---

## File Upload System

### Configuration (Multer)
```javascript
// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on fieldname
    const folder = getFolderByFieldname(file.fieldname);
    cb(null, `uploads/${folder}`);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

// Upload limits
const limits = {
  fileSize: 10 * 1024 * 1024 // 10MB
};
```

### Upload Folders
```
uploads/
├── invoices/           # Asset invoices
├── po/                 # Purchase orders
├── dc/                 # Delivery challans
├── testing-reports/    # Asset testing reports
├── maintenance-reports/# Maintenance reports
└── disposal-docs/      # Disposal documents
```

### File Access
```
Static route: /uploads/*
Example: http://localhost:5000/uploads/invoices/1234567890-abc123.pdf
```

---

## ID Generation System

### Asset ID Format
```
[BRANCHCODE][DDMMYY][ASSETTYPE+SEQ]

Components:
- BRANCHCODE: 3 characters (e.g., HYD, BLR, MUM, DEL)
- DDMMYY: Date (e.g., 010125 for Jan 1, 2025)
- ASSETTYPE: 2 characters (HD, CP, EL, OF, FR, FF, BD)
- SEQ: 3-digit sequence (001, 002, ...)

Examples:
- HYD010125CP001 (Hyderabad, Jan 1 2025, Computer, #1)
- BLR150125HD042 (Bangalore, Jan 15 2025, HSDC, #42)
```

### Asset Type Codes
```javascript
const assetTypeCodes = {
  'HSDC': 'HD',
  'COMPUTER': 'CP',
  'ELECTRICAL': 'EL',
  'OFFICE': 'OF',
  'FURNITURE': 'FR',
  'FIREFIGHTING': 'FF',
  'BUILDING': 'BD'
};
```

### Other ID Formats
```
Procurement: PROC-[BRANCHCODE]-[SEQ]
Maintenance: MAINT-[BRANCHCODE]-[SEQ]
Disposal: DISP-[BRANCHCODE]-[SEQ]
```

---

## Deployment Guide

### Prerequisites
```
- Node.js 18+
- MySQL 8.0+
- npm or yarn
- Git
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stpi_asset_tracker

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=24h

# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Bcrypt
BCRYPT_ROUNDS=10

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@stpi.in
FRONTEND_URL=https://yourdomain.com

# Sequelize
SEQUELIZE_SYNC=false
```

### Installation Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd STPI-ASSET-TRACKER
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run seed
node migrateResetToken.js
npm run dev
```

#### 3. Frontend Setup
```bash
cd ..
npm install
npm run dev
```

### Production Deployment

#### 1. Build Frontend
```bash
npm run build
```

#### 2. PM2 Process Manager
```bash
npm install -g pm2
cd backend
pm2 start server.js --name stpi-asset-tracker
pm2 startup
pm2 save
```

#### 3. Nginx Configuration
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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploaded files
    location /uploads {
        alias /path/to/backend/uploads;
    }
}
```

#### 4. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Database Backup
```bash
# Backup
mysqldump -u root -p stpi_asset_tracker > backup.sql

# Restore
mysql -u root -p stpi_asset_tracker < backup.sql
```

---

## Performance Optimization

### Database
- Indexes on foreign keys
- Pagination for large datasets
- Query optimization with Sequelize

### API
- Response compression (gzip)
- Rate limiting
- Caching headers

### Frontend
- Code splitting
- Lazy loading
- Debounced search

---

## Monitoring & Logging

### Winston Logger
```javascript
// Log levels: error, warn, info, http, debug
logger.error('Error message');
logger.info('Info message');

// Log files
logs/error.log  // Error logs only
logs/all.log    // All logs
```

### Health Check
```
GET /api/health

Response:
{
  "status": "OK",
  "message": "STPI Asset Tracker API is running",
  "environment": "production",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify credentials in .env
   - Check firewall settings

2. **JWT Token Expired**
   - Token expires after 24 hours
   - User needs to login again
   - Implement token refresh if needed

3. **File Upload Failed**
   - Check file size (max 10MB)
   - Verify file type is allowed
   - Check uploads folder permissions

4. **CORS Error**
   - Verify CORS_ORIGIN in .env
   - Check frontend API URL

5. **Port Already in Use**
   - Change PORT in .env
   - Kill process using the port

---

## Support & Maintenance

### Regular Tasks
- Database backup (daily)
- Log rotation (weekly)
- Security updates (monthly)
- Performance monitoring

### Contact
For technical support, contact the development team.
