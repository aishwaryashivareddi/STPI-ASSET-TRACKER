# Pre-Push Cleanup Script

##  CRITICAL: Clear These Before Pushing to Git

### 1. Environment Files (Contains Secrets)
```bash
# Check if .env exists
ls backend/.env

# If exists, verify it's in .gitignore
cat .gitignore | grep ".env"

# NEVER commit .env file!
```

### 2. Log Files (Runtime Data)
```bash
# Remove log files
rm -f backend/logs/*.log

# Or on Windows
del backend\logs\*.log
```

### 3. Uploaded Files (User Data)
```bash
# Clear uploaded files (keep .gitkeep)
rm -rf backend/uploads/*
# Keep .gitkeep
touch backend/uploads/.gitkeep

# Or on Windows
del /s /q backend\uploads\*.*
echo. > backend\uploads\.gitkeep
```

### 4. Node Modules (Dependencies)
```bash
# These should already be in .gitignore
# Verify they're excluded
cat .gitignore | grep "node_modules"
```

### 5. Build Output
```bash
# Remove build files
rm -rf dist/

# Or on Windows
rmdir /s /q dist
```

### 6. Database Files (If Any)
```bash
# Remove any .sql dump files
rm -f *.sql
rm -f backend/*.sql
```

## ✅ Quick Cleanup Commands

### Windows
```cmd
REM Delete logs
del /q backend\logs\*.log 2>nul

REM Clear uploads (keep structure)
for /d %%i in (backend\uploads\*) do rmdir /s /q "%%i"
del /q backend\uploads\*.* 2>nul
echo. > backend\uploads\.gitkeep

REM Remove dist
rmdir /s /q dist 2>nul

REM Remove any SQL files
del /q *.sql 2>nul
del /q backend\*.sql 2>nul
```

### Linux/Mac
```bash
# Delete logs
rm -f backend/logs/*.log

# Clear uploads (keep structure)
find backend/uploads -type f ! -name '.gitkeep' -delete

# Remove dist
rm -rf dist/

# Remove any SQL files
rm -f *.sql backend/*.sql
```

## 🔍 Verification Checklist

Run these commands to verify:

```bash
# 1. Check .env is NOT staged
git status | grep ".env"
# Should show nothing or "Untracked" (not "Changes to be committed")

# 2. Check node_modules is NOT staged
git status | grep "node_modules"
# Should show nothing

# 3. Check uploads are empty (except .gitkeep)
ls -la backend/uploads/
# Should only show .gitkeep

# 4. Check logs are empty
ls -la backend/logs/
# Should be empty or not exist

# 5. Verify .gitignore is working
git check-ignore backend/.env
# Should output: backend/.env

git check-ignore backend/node_modules
# Should output: backend/node_modules
```

## 📋 Safe to Commit

These files SHOULD be committed:

✅ Source code (.js, .jsx files)
✅ Configuration templates (.env.example)
✅ Package.json files
✅ Documentation (.md files)
✅ Seed data (assets_seed_data.json)
✅ Seed scripts (seedDatabase.js)
✅ .gitignore
✅ .gitkeep files

## ❌ NEVER Commit

❌ .env (contains secrets)
❌ node_modules/ (too large, installed via npm)
❌ logs/*.log (runtime data)
❌ uploads/* (user files)
❌ dist/ (build output)
❌ *.sql (database dumps)
❌ .DS_Store (Mac)
❌ Thumbs.db (Windows)

## 🚀 Final Pre-Push Command

```bash
# Run this before git push
git status

# Review the output carefully
# Make sure no sensitive files are listed under "Changes to be committed"
```

## 🔒 Security Check

```bash
# Search for potential secrets in staged files
git diff --cached | grep -i "password\|secret\|key\|token"

# If anything shows up, review carefully!
```

## ✅ Ready to Push When:

1. [ ] .env is NOT in git status
2. [ ] node_modules/ is NOT in git status
3. [ ] logs/ is empty or excluded
4. [ ] uploads/ only has .gitkeep
5. [ ] No passwords/secrets in code
6. [ ] .gitignore is working correctly
7. [ ] All documentation is updated

## 🎯 Quick Cleanup Script

Save this as `cleanup.sh` (Linux/Mac) or `cleanup.bat` (Windows):

**cleanup.bat (Windows):**
```batch
@echo off
echo Cleaning up before Git push...
del /q backend\logs\*.log 2>nul
for /d %%i in (backend\uploads\*) do rmdir /s /q "%%i"
del /q backend\uploads\*.* 2>nul
echo. > backend\uploads\.gitkeep
rmdir /s /q dist 2>nul
del /q *.sql 2>nul
echo Cleanup complete!
echo.
echo Now run: git status
```

**cleanup.sh (Linux/Mac):**
```bash
#!/bin/bash
echo "Cleaning up before Git push..."
rm -f backend/logs/*.log
find backend/uploads -type f ! -name '.gitkeep' -delete
rm -rf dist/
rm -f *.sql backend/*.sql
echo "Cleanup complete!"
echo ""
echo "Now run: git status"
```

## 📞 If You Accidentally Committed Secrets

```bash
# Remove file from git but keep locally
git rm --cached backend/.env

# Commit the removal
git commit -m "Remove .env from git"

# If already pushed, you may need to:
# 1. Change all secrets/passwords
# 2. Force push (dangerous!)
# 3. Or contact Git admin
```

---

**Always run cleanup before pushing to Git!**
