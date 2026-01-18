# STPI Asset Tracker - Application Flow Diagram

## System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STPI ASSET TRACKER SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Browser   │  │   Browser   │  │   Browser   │  │   Browser   │        │
│  │   (Admin)   │  │  (Manager)  │  │   (User)    │  │  (Public)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                 │
│         └────────────────┴────────────────┴────────────────┘                 │
│                                  │                                            │
│                                  │ HTTP/HTTPS                                 │
│                                  ▼                                            │
│         ┌────────────────────────────────────────────────┐                   │
│         │      React Frontend (Port 5173)                │                   │
│         │  ┌──────────────────────────────────────────┐  │                   │
│         │  │  Components:                             │  │                   │
│         │  │  - Login / ForgotPassword / ResetPassword│  │                   │
│         │  │  - Dashboard                             │  │                   │
│         │  │  - Assets                                │  │                   │
│         │  │  - Procurements                          │  │                   │
│         │  │  - Maintenances                          │  │                   │
│         │  │  - Disposals                             │  │                   │
│         │  └──────────────────────────────────────────┘  │                   │
│         │  ┌──────────────────────────────────────────┐  │                   │
│         │  │  State Management:                       │  │                   │
│         │  │  - localStorage (token, user)            │  │                   │
│         │  │  - React useState/useEffect              │  │                   │
│         │  └──────────────────────────────────────────┘  │                   │
│         └────────────────────┬───────────────────────────┘                   │
│                              │                                                │
└──────────────────────────────┼────────────────────────────────────────────────┘
                               │
                               │ REST API (JSON)
                               │ Authorization: Bearer <JWT>
                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│         ┌────────────────────────────────────────────────┐                   │
│         │   Node.js + Express Server (Port 5000)         │                   │
│         │                                                 │                   │
│         │  ┌───────────────────────────────────────────┐ │                   │
│         │  │  Middleware Stack:                        │ │                   │
│         │  │  1. Helmet (Security Headers)             │ │                   │
│         │  │  2. CORS (Cross-Origin)                   │ │                   │
│         │  │  3. Rate Limiter (100 req/15min)          │ │                   │
│         │  │  4. Body Parser (JSON/URL-encoded)        │ │                   │
│         │  │  5. Morgan (Logging)                      │ │                   │
│         │  │  6. Compression                           │ │                   │
│         │  └───────────────────────────────────────────┘ │                   │
│         │                                                 │                   │
│         │  ┌───────────────────────────────────────────┐ │                   │
│         │  │  Routes:                                  │ │                   │
│         │  │  /api/auth        → authRoutes            │ │                   │
│         │  │  /api/assets      → assetRoutes           │ │                   │
│         │  │  /api/procurements→ procurementRoutes     │ │                   │
│         │  │  /api/maintenances→ maintenanceRoutes     │ │                   │
│         │  │  /api/disposals   → disposalRoutes        │ │                   │
│         │  │  /api/master      → masterRoutes          │ │                   │
│         │  │  /uploads         → Static Files          │ │                   │
│         │  └───────────────────────────────────────────┘ │                   │
│         │                                                 │                   │
│         │  ┌───────────────────────────────────────────┐ │                   │
│         │  │  Authentication Middleware:               │ │                   │
│         │  │  - authenticate() → Verify JWT            │ │                   │
│         │  │  - authorize([roles]) → Check permissions │ │                   │
│         │  └───────────────────────────────────────────┘ │                   │
│         │                                                 │                   │
│         │  ┌───────────────────────────────────────────┐ │                   │
│         │  │  Controllers:                             │ │                   │
│         │  │  - authController                         │ │                   │
│         │  │  - assetController                        │ │                   │
│         │  │  - procurementController                  │ │                   │
│         │  │  - maintenanceController                  │ │                   │
│         │  │  - disposalController                     │ │                   │
│         │  │  - masterController                       │ │                   │
│         │  └───────────────────────────────────────────┘ │                   │
│         │                                                 │                   │
│         │  ┌───────────────────────────────────────────┐ │                   │
│         │  │  Services:                                │ │                   │
│         │  │  - emailService (Password Reset)          │ │                   │
│         │  │  - idGenerator (Asset ID Generation)      │ │                   │
│         │  └───────────────────────────────────────────┘ │                   │
│         │                                                 │                   │
│         │  ┌───────────────────────────────────────────┐ │                   │
│         │  │  File Upload (Multer):                    │ │                   │
│         │  │  - Invoice, PO, DC, Testing Reports       │ │                   │
│         │  │  - Maintenance Reports, Disposal Docs     │ │                   │
│         │  │  - Max Size: 10MB                         │ │                   │
│         │  └───────────────────────────────────────────┘ │                   │
│         └────────────────────┬────────────────────────────┘                   │
│                              │                                                │
└──────────────────────────────┼────────────────────────────────────────────────┘
                               │
                               │ Sequelize ORM
                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│         ┌────────────────────────────────────────────────┐                   │
│         │   MySQL Database (stpi_asset_tracker)          │                   │
│         │                                                 │                   │
│         │  ┌───────────────────────────────────────────┐ │                   │
│         │  │  Tables:                                  │ │                   │
│         │  │  - users                                  │ │                   │
│         │  │  - branches                               │ │                   │
│         │  │  - suppliers                              │ │                   │
│         │  │  - assets                                 │ │                   │
│         │  │  - procurements                           │ │                   │
│         │  │  - maintenances                           │ │                   │
│         │  │  - disposals                              │ │                   │
│         │  └───────────────────────────────────────────┘ │                   │
│         └─────────────────────────────────────────────────┘                   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## User Authentication Flow

```
┌─────────┐                                                    ┌─────────┐
│ Browser │                                                    │ Server  │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. POST /api/auth/login                                    │
     │     { email, password }                                     │
     ├────────────────────────────────────────────────────────────►│
     │                                                              │
     │                                    2. Validate credentials  │
     │                                       (bcrypt.compare)       │
     │                                                              │
     │                                    3. Generate JWT token    │
     │                                       (24h expiration)       │
     │                                                              │
     │  4. Response: { token, user }                               │
     │◄────────────────────────────────────────────────────────────┤
     │                                                              │
     │  5. Store in localStorage                                   │
     │     - token                                                  │
     │     - user (id, username, role, branch_id)                  │
     │                                                              │
     │  6. Redirect to /dashboard                                  │
     │                                                              │
     │  7. All subsequent requests include:                        │
     │     Authorization: Bearer <token>                           │
     ├────────────────────────────────────────────────────────────►│
     │                                                              │
     │                                    8. authenticate() middleware
     │                                       - Verify JWT           │
     │                                       - Load user from DB    │
     │                                       - Attach to req.user   │
     │                                                              │
     │                                    9. authorize([roles])     │
     │                                       - Check user.role      │
     │                                       - Allow/Deny access    │
     │                                                              │
     │  10. Response: { data }                                     │
     │◄────────────────────────────────────────────────────────────┤
     │                                                              │
```

---

## Asset Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ASSET LIFECYCLE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. CREATE ASSET
   ┌──────────┐
   │  User    │
   └────┬─────┘
        │ Fill form (name, type, branch, quantity, location, etc.)
        │ Upload files (invoice, PO, DC)
        ▼
   ┌────────────────┐
   │ POST /api/     │
   │ assets         │
   └────┬───────────┘
        │
        ▼
   ┌────────────────────────────────────┐
   │ Backend:                           │
   │ 1. Validate input                  │
   │ 2. Generate Asset ID               │
   │    Format: [BRANCH][DATE][TYPE+SEQ]│
   │    Example: HYD010125CP001         │
   │ 3. Save files to /uploads          │
   │ 4. Create asset record             │
   │ 5. Set testing_status = 'Pending'  │
   └────┬───────────────────────────────┘
        │
        ▼
   ┌────────────────┐
   │ Asset Created  │
   │ Status: Pending│
   └────────────────┘

2. TESTING CONFIRMATION (Admin/Manager only)
   ┌──────────┐
   │ Admin/   │
   │ Manager  │
   └────┬─────┘
        │ View asset with testing_status = 'Pending'
        │ Click "Test" button
        │ Fill testing form (status, remarks)
        │ Upload testing report
        ▼
   ┌────────────────┐
   │ POST /api/     │
   │ assets/:id/    │
   │ testing        │
   └────┬───────────┘
        │
        ▼
   ┌────────────────────────────────────┐
   │ Backend:                           │
   │ 1. Check role (Admin/Manager)      │
   │ 2. Update testing_status           │
   │    (Passed/Failed)                 │
   │ 3. Save testing report             │
   │ 4. Set tested_by, tested_at        │
   └────┬───────────────────────────────┘
        │
        ▼
   ┌────────────────┐
   │ Asset Tested   │
   │ Status: Passed │
   └────────────────┘

3. MAINTENANCE
   ┌──────────┐
   │  User    │
   └────┬─────┘
        │ Create maintenance record
        │ Select asset, type, schedule date
        ▼
   ┌────────────────┐
   │ POST /api/     │
   │ maintenances   │
   └────┬───────────┘
        │
        ▼
   ┌────────────────────────────────────┐
   │ Backend:                           │
   │ 1. Generate Maintenance ID         │
   │ 2. Create maintenance record       │
   │ 3. Status = 'Scheduled'            │
   └────┬───────────────────────────────┘
        │
        ▼
   ┌────────────────┐
   │ Maintenance    │
   │ Scheduled      │
   └────┬───────────┘
        │
        │ When maintenance is done
        ▼
   ┌────────────────┐
   │ POST /api/     │
   │ maintenances/  │
   │ :id/complete   │
   └────┬───────────┘
        │
        ▼
   ┌────────────────────────────────────┐
   │ Backend:                           │
   │ 1. Update status = 'Completed'     │
   │ 2. Set completed_date              │
   │ 3. Update asset status if needed   │
   └────┬───────────────────────────────┘
        │
        ▼
   ┌────────────────┐
   │ Maintenance    │
   │ Completed      │
   └────────────────┘

4. DISPOSAL
   ┌──────────┐
   │  User    │
   └────┬─────┘
        │ Create disposal request
        │ Select asset, method, reason
        ▼
   ┌────────────────┐
   │ POST /api/     │
   │ disposals      │
   └────┬───────────┘
        │
        ▼
   ┌────────────────────────────────────┐
   │ Backend:                           │
   │ 1. Generate Disposal ID            │
   │ 2. Create disposal record          │
   │ 3. Status = 'Pending'              │
   └────┬───────────────────────────────┘
        │
        ▼
   ┌────────────────┐
   │ Disposal       │
   │ Pending        │
   └────┬───────────┘
        │
        │ Admin reviews and approves
        ▼
   ┌────────────────┐
   │ POST /api/     │
   │ disposals/:id/ │
   │ approve        │
   └────┬───────────┘
        │
        ▼
   ┌────────────────────────────────────┐
   │ Backend:                           │
   │ 1. Check role (Admin only)         │
   │ 2. Update status = 'Approved'      │
   │ 3. Set approved_by, approved_at    │
   │ 4. Update asset status = 'Disposed'│
   └────┬───────────────────────────────┘
        │
        ▼
   ┌────────────────┐
   │ Asset Disposed │
   └────────────────┘
```

---

## Procurement Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROCUREMENT APPROVAL FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  User    │
└────┬─────┘
     │ Create procurement request
     │ (branch, requisition date, budget)
     ▼
┌────────────────┐
│ POST /api/     │
│ procurements   │
└────┬───────────┘
     │
     ▼
┌────────────────────────────────────┐
│ Backend:                           │
│ 1. Generate Procurement ID         │
│ 2. Create procurement record       │
│ 3. approval_status = 'Pending'     │
│ 4. created_by = current user       │
└────┬───────────────────────────────┘
     │
     ▼
┌────────────────┐
│ Procurement    │
│ Status: Pending│
└────┬───────────┘
     │
     │ Manager/Admin reviews
     ▼
┌────────────────┐
│ POST /api/     │
│ procurements/  │
│ :id/approve    │
└────┬───────────┘
     │
     ▼
┌────────────────────────────────────┐
│ Backend:                           │
│ 1. Check role (Admin/Manager)      │
│ 2. Update approval_status          │
│    (Approved/Rejected)             │
│ 3. Set approved_by, approved_at    │
└────┬───────────────────────────────┘
     │
     ├─────────────┬─────────────┐
     ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Approved │  │ Rejected │  │ Pending  │
└──────────┘  └──────────┘  └──────────┘
```

---

## RBAC Permission Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

Request → authenticate() → authorize([roles]) → Controller → Response

1. authenticate() Middleware:
   ┌────────────────────────────────────┐
   │ 1. Extract JWT from header         │
   │ 2. Verify token signature          │
   │ 3. Check token expiration          │
   │ 4. Load user from database         │
   │ 5. Check user is_active            │
   │ 6. Attach user to req.user         │
   │ 7. Call next()                     │
   └────────────────────────────────────┘
            │
            ▼
2. authorize([roles]) Middleware:
   ┌────────────────────────────────────┐
   │ 1. Check req.user.role             │
   │ 2. Compare with allowed roles      │
   │ 3. If match: call next()           │
   │ 4. If no match: return 403         │
   └────────────────────────────────────┘
            │
            ▼
3. Controller:
   ┌────────────────────────────────────┐
   │ 1. Additional business logic checks│
   │ 2. Branch-level filtering          │
   │    (if role !== 'Admin')           │
   │ 3. Process request                 │
   │ 4. Return response                 │
   └────────────────────────────────────┘

Example Routes:
- GET /api/assets → authenticate() → All roles
- POST /api/assets/:id/testing → authenticate() → authorize(['Admin','Manager'])
- DELETE /api/assets/:id → authenticate() → authorize(['Admin'])
```

---

## Data Flow Summary

```
User Action → Frontend (React) → API Request (JWT) → Middleware (Auth/RBAC) 
→ Controller (Business Logic) → Model (Sequelize) → Database (MySQL) 
→ Response → Frontend → UI Update
```
