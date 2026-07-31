# STPI Asset Tracker — Team Presentation Document

**Version:** 2.0.0 | **Date:** July 2026 | **Maintained by:** STPI Development Team

---

## 1. Project Overview

The **STPI Asset Tracker** is a full-stack web application built for Software Technology Parks of India (STPI) to manage the complete lifecycle of physical assets across multiple branches. It replaces manual Excel-based tracking with a centralized, role-controlled digital system.

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI Framework |
| React Router DOM | 7.12 | Client-side routing |
| Axios | 1.13 | HTTP client with JWT interceptor |
| Vite | 7.2 | Build tool & dev server |
| qrcode.react | 4.2 | QR code generation |
| html5-qrcode | 2.3 | QR code scanning |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express.js | 4.18 | Web framework |
| Sequelize ORM | 6.35 | Database abstraction |
| MySQL | 8.0+ | Primary database |
| JWT (jsonwebtoken) | 9.0 | Authentication tokens |
| bcryptjs | 2.4 | Password hashing |
| Multer | 1.4 | File upload handling |
| Nodemailer | 7.0 | Email notifications |
| PDFKit | 0.19 | PDF generation |
| XLSX | 0.18 | Excel/CSV import |
| Helmet | 7.1 | Security headers |
| Winston | 3.11 | Logging |
| Swagger UI | 5.0 | API documentation |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│              http://localhost:5173                       │
│                                                         │
│  Login → Dashboard → Assets / Procurement /             │
│          Maintenance / Disposal / Gateway Pass /        │
│          User Management                                │
└──────────────────────┬──────────────────────────────────┘
                       │ Axios (JWT Bearer Token)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                  │
│              http://localhost:5000                      │
│                                                         │
│  Auth Middleware → Route Handlers → Controllers         │
│  File Upload (Multer) → uploads/ folder                 │
│  Email Service (Nodemailer → Gmail SMTP)                │
│  PDF Generation (PDFKit)                                │
└──────────────────────┬──────────────────────────────────┘
                       │ Sequelize ORM
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL 8.0)                   │
│           stpi_asset_tracker                            │
│                                                         │
│  users | branches | suppliers | assets |                │
│  procurements | maintenances | disposals |              │
│  gateway_passes                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### Core Tables

#### `users`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto increment |
| username | VARCHAR(50) | Unique login name |
| full_name | VARCHAR(100) | Display name |
| email | VARCHAR(100) | Unique email |
| password | VARCHAR(255) | bcrypt hashed |
| role | ENUM | Admin / Manager / User |
| branch_id | INT FK | Assigned branch |
| department | VARCHAR(100) | Department name |
| is_active | BOOLEAN | Account status |
| registration_status | VARCHAR(20) | Approved / Pending / Rejected |
| reset_token | VARCHAR(255) | Password reset token |
| reset_token_expiry | DATETIME | Token expiry (1 hour) |

#### `assets`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto increment |
| asset_id | VARCHAR(50) | Auto-generated unique ID |
| asset_type | ENUM | HSDC/COMPUTER/ELECTRICAL/OFFICE/FURNITURE/FIREFIGHTING/BUILDING |
| name | VARCHAR(255) | Asset name |
| serial_number | VARCHAR(500) | Serial number |
| ams_barcode | VARCHAR(50) | AMS barcode |
| branch_id | INT FK | Current branch |
| supplier_id | INT FK | Supplier reference |
| location | VARCHAR(255) | Physical location |
| purchase_value | DECIMAL(15,2) | Purchase cost |
| po_number | VARCHAR(100) | Purchase order number |
| po_date | DATEONLY | PO date |
| invoice_number | VARCHAR(100) | Invoice number |
| invoice_date | DATEONLY | Invoice date |
| invoice_file | VARCHAR(500) | File path |
| po_file | VARCHAR(500) | File path |
| dc_file | VARCHAR(500) | Delivery challan path |
| current_status | ENUM | Working/Not Working/Obsolete/Under Repair/Disposed |
| testing_status | ENUM | Pending/Passed/Failed |
| testing_report_file | VARCHAR(500) | File path |
| warranty_expiry | DATEONLY | Warranty date |
| book_stock | INT | Book stock count |
| physical_stock | INT | Physical stock count |
| stock_difference | INT | Difference |

#### `gateway_passes`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto increment |
| gateway_pass_id | VARCHAR(50) | Auto-generated ID |
| asset_id | INT FK | Asset being transferred |
| from_branch_id | INT FK | Source branch |
| to_branch_id | INT FK | Destination branch |
| reason | TEXT | Transfer reason |
| transfer_date | DATEONLY | Date of transfer |
| pass_through_person | VARCHAR(100) | Person carrying asset |
| prepared_by_person | VARCHAR(100) | Prepared by |
| authorized_by_person | VARCHAR(100) | Authorized by |
| received_by_person | VARCHAR(100) | Received by |
| signed_copy | VARCHAR(500) | Signed copy file path |
| status | ENUM | Completed |

#### `procurements`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto increment |
| procurement_id | VARCHAR(50) | Auto-generated ID |
| asset_name | VARCHAR(255) | Requested asset |
| asset_type | ENUM | Asset category |
| quantity | INT | Requested quantity |
| estimated_cost | DECIMAL | Estimated cost |
| branch_id | INT FK | Requesting branch |
| approval_status | ENUM | Pending/Approved/Rejected |
| approved_by | INT FK | Approver user |
| approved_at | DATETIME | Approval timestamp |

#### `maintenances`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto increment |
| maintenance_id | VARCHAR(50) | Auto-generated ID |
| asset_id | INT FK | Asset under maintenance |
| maintenance_type | ENUM | Preventive/Corrective/Emergency |
| issue_description | TEXT | Problem description |
| scheduled_date | DATEONLY | Scheduled date |
| completed_date | DATEONLY | Completion date |
| cost | DECIMAL | Maintenance cost |
| status | ENUM | Scheduled/In Progress/Completed |
| maintenance_report_file | VARCHAR(500) | Report file path |

#### `disposals`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto increment |
| disposal_id | VARCHAR(50) | Auto-generated ID |
| asset_id | INT FK | Asset being disposed |
| disposal_method | ENUM | Auction/Scrap/Donation/e-Waste |
| reason | TEXT | Disposal reason |
| status | ENUM | Pending/Approved/Rejected |
| approved_by | INT FK | Admin approver |

---

## 5. Auto-Generated ID Format

All IDs follow a consistent pattern:

```
Assets:       [BRANCHCODE][DDMMYY][TYPECODE][SEQ]
              Example: HYD080726FF001
              → Hyderabad | 08/07/26 | FireFighting | #001

Procurement:  [BRANCHCODE][DDMMYY]PR[SEQ]
              Example: HYD080726PR001

Maintenance:  [BRANCHCODE][DDMMYY]MT[SEQ]
              Example: HYD080726MT001

Disposal:     [BRANCHCODE][DDMMYY]DS[SEQ]
              Example: HYD080726DS001

Gateway Pass: [BRANCHCODE][DDMMYY]GP[SEQ]
              Example: HYD080726GP001
```

**Asset Type Codes:**
| Code | Type |
|---|---|
| HD | HSDC Equipment |
| CP | Computer |
| EL | Electrical |
| OF | Office |
| FR | Furniture |
| FF | Fire-Fighting |
| BD | Building |

---

## 6. Role-Based Access Control (RBAC)

| Feature | Admin | Manager | User |
|---|---|---|---|
| View Assets | All Branches | Own Branch | Own Branch |
| Create Asset | ✅ | ✅ | ✅ |
| Edit Asset | ✅ | ✅ | ✅ |
| Delete Asset | ✅ | ❌ | ❌ |
| Confirm Testing | ✅ | ✅ | ❌ |
| Approve Procurement | ✅ | ✅ | ❌ |
| Approve Disposal | ✅ | ❌ | ❌ |
| Create Gateway Pass | ✅ | ✅ | ✅ |
| Upload Signed Copy | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |
| Approve Self-Registration | ✅ | ❌ | ❌ |
| Bulk Asset Create | ✅ | ✅ | ❌ |
| Import from Excel | ✅ | ✅ | ❌ |

---

## 7. Functional Modules

### 7.1 Dashboard
- Asset statistics: Total, Working, Not Working, Obsolete
- Maintenance statistics: Scheduled, In Progress, Completed
- Assets by type breakdown (7 categories)
- Pending testing count with quick navigation
- Quick links to all modules

### 7.2 Asset Management
- List all assets with pagination (20 per page)
- Search by: Asset ID, Name, Serial Number, Supplier Name, Asset Type
- Filter by: Asset Type, Status, Testing Status
- Sortable columns: Asset ID, Name, Type, Status, Value
- Create asset with auto-generated ID
- Edit asset details
- Confirm testing (Admin/Manager)
- File attachments: Invoice, PO, Delivery Challan, Testing Report
- File operations: View (inline preview), Download (with auth), Delete
- QR code generation per asset
- Bulk QR print for selected assets
- QR scanner to quickly find assets

### 7.3 Bulk Asset Creation
**Tab 1 — Bulk by Quantity:**
- Create 2–500 identical assets in one operation
- Common fields: Name, Type, Branch, Location, Value, PO Number, Supplier, Warranty
- Upload shared Invoice and PO files (attached to all created assets)
- Auto-generates unique IDs and QR codes for each asset
- Print all QR labels after creation

**Tab 2 — Import from Excel/CSV:**
- Download CSV template with required columns
- Upload filled Excel/CSV file
- Upload shared Invoice and PO files
- Validates asset types and branch IDs
- Reports skipped rows with error details
- Branch ID reference table shown on screen

### 7.4 Procurement
- Create procurement requests with estimated cost
- List all requests with status tracking
- Approve/Reject (Admin/Manager)
- Audit trail: approved_by, approved_at

### 7.5 Maintenance
- Create maintenance records (Preventive/Corrective/Emergency)
- Schedule and track maintenance activities
- Complete maintenance with report upload
- Auto-updates asset status to Working on completion
- **Email notification** sent to department on new maintenance request
  - IT dept → COMPUTER, HSDC assets
  - Electrical dept → ELECTRICAL assets
  - Admin dept → OFFICE, FURNITURE assets
  - Safety dept → FIREFIGHTING assets
  - Civil dept → BUILDING assets

### 7.6 Disposal
- Create disposal requests with method (Auction/Scrap/Donation/e-Waste)
- Admin-only approval
- Asset status updated to Disposed on approval

### 7.7 Gateway Pass (Asset Transfer)
- Transfer assets between branches
- Auto-completes transfer immediately on creation
- Asset branch updated in real-time
- Gate Pass document with STPI letterhead
- Fields: Pass Through Person, Prepared By, Authorized By, Received By
- **Print** — browser print with STPI logo and formatted layout
- **Download PDF** — server-generated PDF via PDFKit
- **Upload Signed Copy** — attach scanned signed gate pass
- **View/Download/Delete** signed copy from Files modal
- Edit gate pass details after creation

### 7.8 User Management (Admin only)
- Create users directly (immediately active)
- Edit user details, role, branch, department
- Activate/Deactivate users (click status badge)
- Reset user passwords
- Delete users
- **Pending Approvals tab** — approve/reject self-registered users
- **Rejected tab** — view rejected registrations
- Branch dropdown with **+ Add New Branch** option

### 7.9 Authentication
- JWT-based authentication (7-day expiry)
- Auto-redirect on token expiry (401 response)
- Forgot Password flow:
  1. User enters email on /forgot-password
  2. System generates secure token (1-hour expiry)
  3. Reset link sent via Gmail SMTP
  4. User clicks link → /reset-password?token=xxx
  5. New password saved with bcrypt hash
- Self-registration with admin approval workflow
- Protected routes on frontend

---

## 8. API Endpoints Summary

### Authentication
```
POST /api/auth/login              — Login
POST /api/auth/forgot-password    — Request reset link
POST /api/auth/reset-password     — Reset with token
GET  /api/auth/me                 — Get current user
```

### Assets
```
GET    /api/assets                        — List (with filters/search/pagination)
POST   /api/assets                        — Create (multipart)
GET    /api/assets/:id                    — Get single
PUT    /api/assets/:id                    — Update (multipart)
DELETE /api/assets/:id                    — Delete (Admin)
POST   /api/assets/:id/testing            — Confirm testing
GET    /api/assets/stats                  — Statistics
DELETE /api/assets/:id/file/:field        — Delete file
GET    /api/assets/:id/file/:field/download — Download file
POST   /api/assets/bulk/create            — Bulk create (multipart)
POST   /api/assets/bulk/import            — Import Excel/CSV (multipart)
```

### Procurement
```
GET  /api/procurements              — List
POST /api/procurements              — Create
POST /api/procurements/:id/approve  — Approve/Reject
DELETE /api/procurements/:id        — Delete
```

### Maintenance
```
GET  /api/maintenances              — List
POST /api/maintenances              — Create (sends email)
POST /api/maintenances/:id/complete — Complete
DELETE /api/maintenances/:id        — Delete
GET  /api/maintenances/stats        — Statistics
```

### Disposal
```
GET  /api/disposals              — List
POST /api/disposals              — Create (multipart)
POST /api/disposals/:id/approve  — Approve/Reject (Admin)
DELETE /api/disposals/:id        — Delete
```

### Gateway Pass
```
GET    /api/gateway-passes                    — List
GET    /api/gateway-passes/:id                — Get single
POST   /api/gateway-passes                    — Create (transfers asset)
PUT    /api/gateway-passes/:id                — Update
GET    /api/gateway-passes/:id/download-pdf   — Download PDF
POST   /api/gateway-passes/:id/upload-signed  — Upload signed copy
GET    /api/gateway-passes/:id/download-signed — Download signed copy
DELETE /api/gateway-passes/:id/signed-copy    — Delete signed copy
DELETE /api/gateway-passes/:id                — Delete (Admin)
```

### Users (Admin only)
```
GET  /api/users                       — List approved users
GET  /api/users/pending               — Pending registrations
GET  /api/users/rejected              — Rejected registrations
POST /api/users                       — Create user
PUT  /api/users/:id                   — Update user
POST /api/users/:id/approve           — Approve registration
POST /api/users/:id/reject            — Reject registration
POST /api/users/:id/reset-password    — Reset password
DELETE /api/users/:id                 — Delete user
POST /api/users/self-register         — Public self-registration
```

### Master Data
```
GET  /api/master/branches    — List active branches
POST /api/master/branches    — Create branch (Admin)
GET  /api/master/suppliers   — List suppliers
POST /api/master/suppliers   — Create supplier (Admin/Manager)
```

---

## 9. Security Features

| Feature | Implementation |
|---|---|
| Password Hashing | bcrypt with 10 salt rounds |
| Authentication | JWT Bearer tokens (7-day expiry) |
| Password Reset | Secure random token, 1-hour expiry |
| Rate Limiting | 1000 req/15min (configurable) |
| Self-Registration | 5 attempts/hour limit |
| Security Headers | Helmet.js (XSS, CSRF, etc.) |
| CORS | Configured for frontend origin only |
| File Validation | Type + size (10MB limit) |
| Input Validation | express-validator on all endpoints |
| Branch Isolation | Non-admin users filtered at DB level |
| Route Protection | Frontend ProtectedRoute + Backend middleware |

---

## 10. File Upload System

### Supported File Types
- PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX

### Upload Directories
```
uploads/
├── invoices/          — Invoice files
├── po/                — Purchase order files
├── dc/                — Delivery challan files
├── testing-reports/   — Testing report files
├── maintenance-reports/ — Maintenance reports
├── disposal-docs/     — Disposal documents
└── gateway-passes/    — Signed gate pass copies
```

### File Naming
`{original_name}-{timestamp}-{random}.{ext}`
Example: `Invoice_ABC-1785141234567-123456789.pdf`

### File Size Limit
10MB per file

---

## 11. Email Notification System

### Configuration (`.env`)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
```

### Triggers
| Event | Recipient | Content |
|---|---|---|
| New Maintenance Request | Department email (by asset type) | Asset ID, Type, Scheduled Date, Requested By |
| Forgot Password | User's registered email | Reset link (1-hour validity) |

### Department Email Mapping
```
COMPUTER / HSDC    → DEPT_EMAIL_IT       (default: it@stpi.in)
ELECTRICAL         → DEPT_EMAIL_ELECTRICAL (default: electrical@stpi.in)
OFFICE / FURNITURE → DEPT_EMAIL_ADMIN    (default: admin@stpi.in)
FIREFIGHTING       → DEPT_EMAIL_SAFETY   (default: safety@stpi.in)
BUILDING           → DEPT_EMAIL_CIVIL    (default: civil@stpi.in)
```

---

## 12. Setup & Deployment

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm

### Environment Variables (backend/.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stpi_asset_tracker
DB_PORT=3306
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000
CORS_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:5173
```

### Fresh Installation (New System)
```bash
# 1. Clone / copy project

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure database
cp .env.example .env
# Edit .env with MySQL credentials

# 4. Seed database (creates tables + imports 394 assets)
npm run seed

# 5. Start backend
npm run dev

# 6. Install frontend dependencies (from project root)
cd ..
npm install

# 7. Start frontend
npm run dev
```

### Existing System — Run Migrations
```bash
cd backend
node migrateGatewayPassFields.js      # Adds gate pass person fields
node migrateGatewayPassSignedCopy.js  # Adds signed_copy column
node migrateResetToken.js             # Adds reset token fields
node migrateUserFields.js             # Adds user fields
```

### Production Deployment
```bash
# Build frontend
npm run build

# Start backend with PM2
npm install -g pm2
cd backend
pm2 start server.js --name stpi-asset-tracker
pm2 startup && pm2 save
```

---

## 13. Default Login Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@stpi.in | admin123 | All branches, full permissions |
| Manager | manager.hyd@stpi.in | admin123 | Hyderabad branch, approve procurement/testing |
| User | user.hyd@stpi.in | admin123 | Hyderabad branch, view & create only |

> ⚠️ Change all default passwords before production deployment.

---

## 14. Pre-Imported Data

The system comes with **394 assets** pre-imported from STPI Hyderabad's Excel register:
- Parsed using Python (openpyxl/pandas)
- Converted to `assets_seed_data.json`
- Imported during `npm run seed`
- Covers all 7 asset categories
- Includes supplier data, purchase values, locations, AMS barcodes

---

## 15. Key Components (Frontend)

| Component | File | Purpose |
|---|---|---|
| SearchableSelect | components/SearchableSelect.jsx | Type-to-search dropdown with add option |
| Toast | components/Toast.jsx | Success/error notifications |
| Pagination | components/Pagination.jsx | Page navigation |
| ProtectedRoute | components/ProtectedRoute.jsx | Auth route guard |
| AssetQR | components/AssetQR.jsx | QR code modal + bulk print |
| QRModal | components/QRModal.jsx | QR scan result display |

---

## 16. Logging

Logs stored in `backend/logs/`:
- `all.log` — All requests and info
- `error.log` — Errors only

Log format: `[timestamp] [level]: message`

---

## 17. API Documentation

Swagger UI available at:
```
http://localhost:5000/api-docs
```

Health check:
```
http://localhost:5000/api/health
```

---

## 18. Known Limitations & Future Roadmap

### Current Limitations
- File storage is local filesystem (not cloud)
- Single branch per user assignment
- No real-time notifications (polling-based)
- Reports are basic (no advanced analytics)

### Planned Features
- [ ] Advanced reporting & analytics dashboard
- [ ] Email notifications for procurement/disposal approvals
- [ ] Mobile app (React Native)
- [ ] Barcode/QR scanning via mobile camera
- [ ] Asset depreciation calculation
- [ ] Bulk operations (bulk delete, bulk status update)
- [ ] Export to Excel/PDF
- [ ] Cloud file storage (AWS S3)
- [ ] Audit trail / activity log

---

## 19. Project Structure

```
STPI-ASSET-TRACKER/
├── backend/
│   ├── config/          — DB, logger, Swagger config
│   ├── controllers/     — Request handlers (8 controllers)
│   ├── middleware/       — Auth, error handler, file upload
│   ├── models/          — Sequelize models (8 models)
│   ├── routes/          — API routes (8 route files)
│   ├── services/        — Email services
│   ├── utils/           — ID generator, API response, error classes
│   ├── validators/      — Input validation rules
│   ├── uploads/         — File storage (7 subdirectories)
│   ├── logs/            — Application logs
│   └── server.js        — Entry point
├── src/
│   ├── components/      — Reusable React components (6)
│   ├── utils/           — File validation helper
│   ├── api.js           — Axios API client with interceptors
│   ├── App.jsx          — Router configuration
│   ├── Dashboard.jsx    — Statistics dashboard
│   ├── Assets.jsx       — Asset management
│   ├── BulkAssetCreate.jsx — Bulk creation & import
│   ├── Procurements.jsx — Procurement workflow
│   ├── Maintenances.jsx — Maintenance tracking
│   ├── Disposals.jsx    — Disposal management
│   ├── GatewayPasses.jsx — Asset transfer
│   ├── UserManagement.jsx — User admin
│   ├── Login.jsx        — Authentication
│   ├── ForgotPassword.jsx — Password reset request
│   └── ResetPassword.jsx — Password reset form
└── public/
    └── stpi-logo.png    — STPI official logo
```

---

*Document prepared for STPI Development Team — July 2026*
*For technical queries, refer to backend/logs/ and API docs at /api-docs*
