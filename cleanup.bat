@echo off
echo ========================================
echo STPI Asset Tracker - Pre-Push Cleanup
echo ========================================
echo.

echo [1/5] Clearing log files...
del /q backend\logs\*.log 2>nul
echo Done.

echo [2/5] Clearing uploaded files...
for /d %%i in (backend\uploads\*) do rmdir /s /q "%%i" 2>nul
del /q backend\uploads\*.* 2>nul
echo. > backend\uploads\.gitkeep
echo Done.

echo [3/5] Removing build output...
rmdir /s /q dist 2>nul
echo Done.

echo [4/5] Removing SQL dumps...
del /q *.sql 2>nul
del /q backend\*.sql 2>nul
echo Done.

echo [5/5] Verifying .env is not staged...
git status | findstr ".env" >nul
if %errorlevel%==0 (
    echo WARNING: .env file detected in git status!
    echo Please ensure it's in .gitignore
) else (
    echo OK: .env not in git status
)
echo.

echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: git status
echo 2. Review files to be committed
echo 3. Run: git add .
echo 4. Run: git commit -m "Your message"
echo 5. Run: git push
echo.
pause
