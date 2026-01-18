# STPI Asset Tracker - Database ER Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STPI ASSET TRACKER DATABASE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     BRANCHES     │
├──────────────────┤
│ PK id            │
│    name          │
│    code          │◄──────────────┐
│    address       │               │
│    is_active     │               │
│    created_at    │               │
│    updated_at    │               │
└──────────────────┘               │
         △                         │
         │                         │
         │ 1:N                     │
         │                         │
┌────────┴─────────┐               │
│      USERS       │               │
├──────────────────┤               │
│ PK id            │               │
│    username      │               │
│    email         │               │
│    password      │               │
│    role          │               │
│ FK branch_id     │───────────────┘
│    reset_token   │
│    reset_token_  │
│      expiry      │
│    is_active     │
│    created_at    │
│    updated_at    │
└──────────────────┘
         △
         │
         │ 1:N (created_by, updated_by, tested_by, approved_by, performed_by)
         │
         ├──────────────────────────────────────────────────────┐
         │                                                       │
         │                                                       │
┌────────┴─────────┐          ┌──────────────────┐      ┌──────┴──────────┐
│     ASSETS       │          │    SUPPLIERS     │      │  PROCUREMENTS   │
├──────────────────┤          ├──────────────────┤      ├─────────────────┤
│ PK id            │          │ PK id            │      │ PK id           │
│    asset_id      │          │    name          │◄─┐   │    procurement_ │
│    name          │          │    contact_      │  │   │      id         │
│    asset_type    │          │      person      │  │   │    po_number    │
│    quantity      │          │    email         │  │   │    requisition_ │
│ FK branch_id     │──────┐   │    phone         │  │   │      date       │
│    location      │      │   │    address       │  │   │    budget_      │
│    serial_number │      │   │    is_active     │  │   │      allocated  │
│    ams_barcode   │      │   │    created_at    │  │   │    approval_    │
│ FK supplier_id   │──────┼───│    updated_at    │  │   │      status     │
│    po_number     │      │   └──────────────────┘  │   │ FK branch_id    │───┐
│    po_date       │      │                         │   │ FK asset_id     │   │
│    po_file       │      │                         │   │ FK created_by   │   │
│    dc_file       │      │                         │   │ FK approved_by  │   │
│    invoice_date  │      │                         │   │    approved_at  │   │
│    invoice_file  │      │                         │   │    created_at   │   │
│    purchase_value│      │                         │   │    updated_at   │   │
│    current_status│      │                         │   └─────────────────┘   │
│    book_stock    │      │                         │                         │
│    physical_stock│      │                         │                         │
│    stock_        │      │                         │                         │
│      difference  │      │                         │                         │
│    testing_status│      │                         │                         │
│    testing_      │      │                         │                         │
│      report_file │      │                         │                         │
│    remarks       │      │                         │                         │
│ FK created_by    │      │                         │                         │
│ FK updated_by    │      │                         │                         │
│ FK tested_by     │      │                         │                         │
│    tested_at     │      │                         │                         │
│    created_at    │      │                         │                         │
│    updated_at    │      │                         │                         │
└──────────────────┘      │                         │                         │
         △                │                         │                         │
         │                │                         │                         │
         │ 1:N            │                         │                         │
         │                │                         │                         │
         ├────────────────┼─────────────────────────┼─────────────────────────┤
         │                │                         │                         │
┌────────┴─────────┐  ┌───┴──────────────┐   ┌─────┴──────────────┐          │
│  MAINTENANCES    │  │    DISPOSALS     │   │                    │          │
├──────────────────┤  ├──────────────────┤   │                    │          │
│ PK id            │  │ PK id            │   │                    │          │
│    maintenance_  │  │    disposal_id   │   │                    │          │
│      id          │  │    disposal_date │   │                    │          │
│ FK asset_id      │  │    disposal_     │   │                    │          │
│    maintenance_  │  │      method      │   │                    │          │
│      type        │  │    disposal_     │   │                    │          │
│    issue_        │  │      value       │   │                    │          │
│      description │  │    reason        │   │                    │          │
│    scheduled_    │  │    status        │   │                    │          │
│      date        │  │    disposal_docs │   │                    │          │
│    completed_    │  │ FK asset_id      │───┘                    │          │
│      date        │  │ FK approved_by   │                        │          │
│    cost          │  │    approved_at   │                        │          │
│    vendor_name   │  │    created_at    │                        │          │
│    status        │  │    updated_at    │                        │          │
│    maintenance_  │  └──────────────────┘                        │          │
│      report      │                                              │          │
│ FK performed_by  │                                              │          │
│    created_at    │                                              │          │
│    updated_at    │                                              │          │
└──────────────────┘                                              │          │
                                                                  │          │
                                                                  └──────────┘

```

## Relationships Summary

### 1. BRANCHES (1) → (N) USERS
- One branch can have multiple users
- Each user belongs to one branch
- Foreign Key: `users.branch_id` → `branches.id`

### 2. BRANCHES (1) → (N) ASSETS
- One branch can have multiple assets
- Each asset belongs to one branch
- Foreign Key: `assets.branch_id` → `branches.id`

### 3. SUPPLIERS (1) → (N) ASSETS
- One supplier can supply multiple assets
- Each asset can have one supplier (optional)
- Foreign Key: `assets.supplier_id` → `suppliers.id`

### 4. USERS (1) → (N) ASSETS
- Users create, update, and test assets
- Foreign Keys:
  - `assets.created_by` → `users.id`
  - `assets.updated_by` → `users.id`
  - `assets.tested_by` → `users.id`

### 5. ASSETS (1) → (N) PROCUREMENTS
- One asset can have multiple procurement requests
- Each procurement is for one asset (optional)
- Foreign Key: `procurements.asset_id` → `assets.id`

### 6. BRANCHES (1) → (N) PROCUREMENTS
- One branch can have multiple procurement requests
- Each procurement belongs to one branch
- Foreign Key: `procurements.branch_id` → `branches.id`

### 7. USERS (1) → (N) PROCUREMENTS
- Users create and approve procurements
- Foreign Keys:
  - `procurements.created_by` → `users.id`
  - `procurements.approved_by` → `users.id`

### 8. ASSETS (1) → (N) MAINTENANCES
- One asset can have multiple maintenance records
- Each maintenance is for one asset
- Foreign Key: `maintenances.asset_id` → `assets.id`

### 9. USERS (1) → (N) MAINTENANCES
- Users perform maintenance
- Foreign Key: `maintenances.performed_by` → `users.id`

### 10. ASSETS (1) → (N) DISPOSALS
- One asset can have multiple disposal requests
- Each disposal is for one asset
- Foreign Key: `disposals.asset_id` → `assets.id`

### 11. USERS (1) → (N) DISPOSALS
- Users approve disposals
- Foreign Key: `disposals.approved_by` → `users.id`

---

## Table Details

### BRANCHES
**Purpose**: Store STPI branch/location information
**Key Fields**: code (unique 3-char identifier for asset ID generation)

### USERS
**Purpose**: Authentication and authorization
**Key Fields**: role (Admin/Manager/User), branch_id (branch isolation)
**Special**: reset_token fields for password recovery

### SUPPLIERS
**Purpose**: Vendor/supplier master data
**Key Fields**: name, contact details

### ASSETS
**Purpose**: Core asset tracking
**Key Fields**: 
- asset_id (auto-generated: BRANCHCODE + DATE + TYPE + SEQ)
- asset_type (HSDC/COMPUTER/ELECTRICAL/OFFICE/FURNITURE/FIREFIGHTING)
- current_status (Working/Not Working/Obsolete/Under Repair/Disposed)
- testing_status (Pending/Passed/Failed)
- Stock tracking (book_stock, physical_stock, stock_difference)

### PROCUREMENTS
**Purpose**: Purchase request and approval workflow
**Key Fields**: 
- approval_status (Pending/Approved/Rejected)
- approved_by, approved_at (audit trail)

### MAINTENANCES
**Purpose**: Asset maintenance and repair tracking
**Key Fields**: 
- maintenance_type (Preventive/Corrective/Emergency)
- status (Scheduled/In Progress/Completed)

### DISPOSALS
**Purpose**: Asset disposal approval workflow
**Key Fields**: 
- disposal_method (Auction/Scrap/Donation/e-Waste)
- status (Pending/Approved/Rejected)

---

## Indexes

### Primary Keys
- All tables have auto-increment `id` as primary key

### Foreign Keys
- All FK relationships have indexes for query performance

### Unique Constraints
- `users.username` (UNIQUE)
- `users.email` (UNIQUE)
- `branches.code` (UNIQUE)
- `assets.asset_id` (UNIQUE)

### Recommended Indexes
```sql
CREATE INDEX idx_assets_branch ON assets(branch_id);
CREATE INDEX idx_assets_supplier ON assets(supplier_id);
CREATE INDEX idx_assets_status ON assets(current_status);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_procurements_branch ON procurements(branch_id);
CREATE INDEX idx_maintenances_asset ON maintenances(asset_id);
CREATE INDEX idx_disposals_asset ON disposals(asset_id);
```

---

## Data Integrity Rules

1. **Cascade Delete**: Not enabled (preserve audit trail)
2. **Soft Delete**: Use `is_active` flag for users, branches, suppliers
3. **Audit Trail**: All tables have `created_at`, `updated_at` timestamps
4. **User Tracking**: Track who created/updated/approved records
5. **Branch Isolation**: Non-admin users restricted to their branch data

---

## Database Statistics (After Seeding)

- **Branches**: 4 (Hyderabad, Bangalore, Mumbai, Delhi)
- **Users**: 3 (Admin, Manager, User)
- **Suppliers**: 5+ (from Excel import)
- **Assets**: 394 (imported from Excel)
- **Procurements**: 0 (created by users)
- **Maintenances**: 0 (created by users)
- **Disposals**: 0 (created by users)
