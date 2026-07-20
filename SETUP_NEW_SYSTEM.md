# Setup on a New System

## Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm

---

## Step 1 — Copy Project
Copy the entire `STPI-ASSET-TRACKER` folder to the new system.

---

## Step 2 — Configure Backend Environment
```bash
cd backend
copy .env.example .env
```
Open `.env` and set:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_PORT=3306
DB_NAME=stpi_asset_tracker
JWT_SECRET=your-secret-key-32-chars-minimum
PORT=5000
```

---

## Step 3 — Install Dependencies
```bash
# From project root
npm install

# Backend
cd backend
npm install
```

---

## Step 4 — Setup Database
```bash
cd backend
npm run setup
```
This runs seed (tables + 394 assets + default users) then all migrations.

---

## Step 5 — Start Backend
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:5000

---

## Step 6 — Start Frontend
Open a new terminal from project root:
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

---

## Default Login Credentials
| Role    | Email                  | Password |
|---------|------------------------|----------|
| Admin   | admin@stpi.in          | admin123 |
| Manager | manager.hyd@stpi.in    | admin123 |
| User    | user.hyd@stpi.in       | admin123 |

---

## Troubleshooting

**`Unknown column 'full_name' in field list`**
```bash
cd backend
node migrate.js
# Then restart backend
```

**Login fails**
- Check MySQL is running (`services.msc` → MySQL)
- Verify `.env` credentials match your MySQL setup
- Re-run `npm run setup` if database is empty

**Frontend can't reach backend**
- Ensure backend is running on port 5000
- Check no firewall blocking port 5000

**Port already in use**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Maintenance emails not sending**
- Set `SMTP_PASS` in `backend/.env` to a Gmail App Password
- Gmail account: `aishwaryashivareddi09@gmail.com`
