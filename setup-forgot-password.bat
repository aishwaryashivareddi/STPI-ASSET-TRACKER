@echo off
echo ========================================
echo STPI Asset Tracker - Forgot Password Setup
echo ========================================
echo.

echo Step 1: Running database migration...
cd backend
node migrateResetToken.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Migration failed! Please check the error above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Forgot Password feature is now ready to use.
echo.
echo Next steps:
echo 1. Start backend: cd backend ^&^& npm run dev
echo 2. Start frontend: npm run dev
echo 3. Visit http://localhost:5173
echo 4. Click "Forgot Password?" on login page
echo.
echo For testing, check backend console for reset links.
echo See FORGOT_PASSWORD_FEATURE.md for full documentation.
echo.
pause
