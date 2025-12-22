@echo off
echo ========================================
echo   Check if Admin User Exists
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Checking database for admin user...
echo.

call npx tsx scripts/check-admin.ts

echo.
pause

