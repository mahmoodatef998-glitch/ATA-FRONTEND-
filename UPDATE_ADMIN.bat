@echo off
echo ========================================
echo   Update Admin User
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

set /p ADMIN_EMAIL="Enter New Email: "
set /p ADMIN_PASSWORD="Enter New Password (min 12 chars): "
set /p ADMIN_NAME="Enter New Name: "

echo.
echo Updating admin...
echo.

call npx tsx scripts/update-admin.ts

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Please logout and login with new credentials
echo.
pause

