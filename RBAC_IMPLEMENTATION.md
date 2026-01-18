# RBAC Implementation Guide

## Overview
The STPI Asset Tracker implements Role-Based Access Control (RBAC) to manage user permissions across the application. The system uses JWT tokens for authentication and role-based middleware for authorization.

---

## Architecture

### 1. User Roles
Defined in `backend/models/User.js`:
```javascript
role: ENUM('Admin', 'Manager', 'Auditor', 'Viewer', 'User')
```

**Active Roles:**
- **Admin** - Full system access
- **Manager** - Branch-level management with approval rights
- **User** - Basic operations within own branch

---

## Authentication Flow

### 1. Login Process (`backend/controllers/authController.js`)
```javascript
1. User submits email + password
2. System validates credentials
3. JWT token generated with user data (id, username, role)
4. Token sent to client with 24h expiration
5. Client stores token in localStorage
```

### 2. Token Structure
```javascript
{
  id: user.id,
  username: user.username,
  role: user.role,
  exp: timestamp + 24h
}
```

### 3. Authentication Middleware (`backend/middleware/auth.js`)
```javascript
authenticate() - Verifies JWT token and attaches user to request
authorize(...roles) - Checks if user role is in allowed roles list
```

---

## Authorization Matrix

| Feature | Admin | Manager | User |
|---------|-------|---------|------|
| **Assets** |
| View Assets | All Branches | Own Branch | Own Branch |
| Create Asset | ✅ | ✅ | ✅ |
| Edit Asset | ✅ | ✅ | ✅ |
| Delete Asset | ✅ | ❌ | ❌ |
| Confirm Testing | ✅ | ✅ | ❌ |
| Bulk Import | ✅ | ❌ | ❌ |
| **Procurement** |
| View Requests | All Branches | Own Branch | Own Branch |
| Create Request | ✅ | ✅ | ✅ |
| Edit Request | ✅ | Own Branch | Own Branch |
| Approve/Reject | ✅ | ✅ | ❌ |
| Delete Request | ✅ | ❌ | ❌ |
| **Maintenance** |
| View Records | ✅ | ✅ | ✅ |
| Create Record | ✅ | ✅ | ✅ |
| Complete Maintenance | ✅ | ✅ | ✅ |
| Delete Record | ✅ | ❌ | ❌ |
| **Disposal** |
| View Requests | ✅ | ✅ | ✅ |
| Create Request | ✅ | ✅ | ✅ |
| Edit Request | ✅ | ✅ | ✅ |
| Approve/Reject | ✅ | ❌ | ❌ |
| Delete Request | ✅ | ❌ | ❌ |

---

## Implementation Details

### Backend Implementation

#### 1. Route Protection (`backend/routes/assetRoutes.js`)
```javascript
// All routes require authentication
router.use(authenticate);

// Public to authenticated users
router.get('/', assetController.getAllAssets);

// Admin/Manager only
router.post('/:id/testing', 
  authorize(['Admin', 'Manager']), 
  assetController.confirmTesting
);

// Admin only
router.delete('/:id', 
  authorize(['Admin']), 
  assetController.deleteAsset
);
```

#### 2. Controller-Level Checks (`backend/controllers/assetController.js`)
```javascript
// Branch-level access control
if (req.user.role !== 'Admin') {
  where.branch_id = req.user.branch_id;
}

// Role-based permission check
if (!['Admin', 'Manager'].includes(req.user.role)) {
  throw new AppError('Only Admin or Manager can confirm testing', 403);
}
```

#### 3. Data Filtering by Branch
```javascript
// Non-admin users see only their branch data
const where = {};
if (req.user.role !== 'Admin') {
  where.branch_id = req.user.branch_id;
}

const assets = await Asset.findAll({ where });
```

---

### Frontend Implementation

#### 1. Token Storage (`src/Login.jsx`)
```javascript
// Store token and user data after login
localStorage.setItem('token', data.data.token);
localStorage.setItem('user', JSON.stringify(data.data.user));
```

#### 2. API Request Headers (`src/api.js`)
```javascript
// Attach token to all requests
const token = localStorage.getItem('token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

#### 3. UI Permission Checks (`src/Assets.jsx`)
```javascript
// Show/hide buttons based on role
const canConfirmTesting = user?.role === 'Admin' || user?.role === 'Manager';

{canConfirmTesting && asset.testing_status === 'Pending' && (
  <button onClick={() => setShowTestingForm(asset.id)}>Test</button>
)}
```

#### 4. Route Protection (`src/Dashboard.jsx`)
```javascript
// Redirect to login if no token
useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!token || !userData) {
    localStorage.clear();
    navigate('/');
    return;
  }
  setUser(userData);
}, [navigate]);
```

---

## Security Features

### 1. JWT Token Security
- **Expiration**: 24 hours
- **Secret Key**: Stored in environment variable
- **Payload**: Minimal data (id, username, role)
- **Verification**: On every protected route

### 2. Password Security
- **Hashing**: bcrypt with 10 rounds
- **Reset Tokens**: Crypto-generated, 1-hour expiration
- **Validation**: Minimum 6 characters

### 3. API Security
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configured origin whitelist
- **Helmet**: Security headers
- **Input Validation**: Request body validation

### 4. Branch Isolation
- Non-admin users restricted to their branch
- Data filtering at database query level
- Prevents cross-branch data access

---

## Testing RBAC

### Test Users (Default Credentials)
```
Admin:
  Email: admin@stpi.in
  Password: admin123
  Branch: Hyderabad
  Access: All branches, all permissions

Manager:
  Email: manager.hyd@stpi.in
  Password: admin123
  Branch: Hyderabad
  Access: Hyderabad only, approval rights

User:
  Email: user.hyd@stpi.in
  Password: admin123
  Branch: Hyderabad
  Access: Hyderabad only, basic operations
```

### Test Scenarios

#### 1. Admin Access
```bash
# Login as admin
POST /api/auth/login
{ "email": "admin@stpi.in", "password": "admin123" }

# Should see all branches
GET /api/assets

# Can delete assets
DELETE /api/assets/1

# Can approve disposals
POST /api/disposals/1/approve
```

#### 2. Manager Access
```bash
# Login as manager
POST /api/auth/login
{ "email": "manager.hyd@stpi.in", "password": "admin123" }

# Should see only Hyderabad branch
GET /api/assets

# Can approve procurement
POST /api/procurements/1/approve

# Cannot approve disposal (403 Forbidden)
POST /api/disposals/1/approve
```

#### 3. User Access
```bash
# Login as user
POST /api/auth/login
{ "email": "user.hyd@stpi.in", "password": "admin123" }

# Can create assets
POST /api/assets

# Cannot confirm testing (403 Forbidden)
POST /api/assets/1/testing

# Cannot delete (403 Forbidden)
DELETE /api/assets/1
```

---

## Error Handling

### 401 Unauthorized
- No token provided
- Invalid token
- Expired token
- User inactive

### 403 Forbidden
- Valid token but insufficient permissions
- Role not in allowed roles list
- Attempting cross-branch access

### Response Format
```json
{
  "status": "error",
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}
```

---

## Best Practices

### 1. Always Check Permissions
- Backend: Use `authorize()` middleware
- Frontend: Check user role before showing UI elements

### 2. Never Trust Frontend
- Always validate permissions on backend
- Frontend checks are for UX only

### 3. Branch Isolation
- Filter data by branch_id for non-admin users
- Apply at query level, not after fetching

### 4. Token Management
- Store securely (httpOnly cookies in production)
- Clear on logout
- Refresh before expiration

### 5. Audit Trail
- Log permission-denied attempts
- Track who performed actions (created_by, updated_by)

---

## Adding New Roles

### 1. Update User Model
```javascript
// backend/models/User.js
role: ENUM('Admin', 'Manager', 'Auditor', 'Viewer', 'User', 'NewRole')
```

### 2. Define Permissions
```javascript
// backend/routes/yourRoute.js
router.post('/action', 
  authorize(['Admin', 'NewRole']), 
  controller.action
);
```

### 3. Update Frontend
```javascript
// src/YourComponent.jsx
const canPerformAction = ['Admin', 'NewRole'].includes(user?.role);
```

### 4. Update Documentation
- Add to RBAC matrix
- Document permissions
- Update test scenarios

---

## Common Issues

### Issue: Token expired
**Solution**: Implement token refresh or re-login

### Issue: 403 on valid action
**Solution**: Check role spelling, verify authorize() middleware

### Issue: Seeing other branch data
**Solution**: Verify branch_id filtering in controller

### Issue: UI shows button but API denies
**Solution**: Sync frontend permission checks with backend

---

## Security Checklist

- [ ] JWT_SECRET is strong and secret
- [ ] Tokens expire appropriately
- [ ] All protected routes use authenticate()
- [ ] Sensitive actions use authorize()
- [ ] Branch isolation implemented
- [ ] Frontend checks match backend
- [ ] Passwords are hashed
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Audit logging in place

---

## References

- Authentication Middleware: `backend/middleware/auth.js`
- User Model: `backend/models/User.js`
- Route Protection: `backend/routes/*.js`
- Controllers: `backend/controllers/*.js`
- Frontend Auth: `src/api.js`, `src/Login.jsx`
