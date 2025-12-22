@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Fix Database Constraints and Sync Schema
echo ========================================
echo.

REM Use Session Pooler
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will:
echo 1. Fix database constraints
echo 2. Create missing tables
echo 3. Sync schema
echo.
echo ⚠️  IMPORTANT: Run the SQL in Supabase SQL Editor first!
echo.
echo Step 1: Go to Supabase Dashboard → SQL Editor
echo Step 2: Copy SQL from: FIX_DATABASE_CONSTRAINTS.sql
echo Step 3: Run the SQL
echo Step 4: Press any key here to continue with schema sync...
echo.
pause

echo.
echo [1/2] Syncing schema with db push...
echo ⚠️  You will be asked to confirm (type 'y' and press Enter)
echo.

call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate

if errorlevel 1 (
    echo.
    echo ❌ Schema sync failed!
    echo.
    echo Please check the error messages above.
    echo Make sure you ran the SQL from FIX_DATABASE_CONSTRAINTS.sql first.
    pause
    exit /b 1
)

echo.
echo [2/2] Generating Prisma Client...
call npx prisma generate --schema=prisma/schema.prisma

if errorlevel 1 (
    echo.
    echo ❌ Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Database Fixed and Synced!
echo ========================================
echo.
echo Now you can run:
echo   CHECK_ADMIN_EXISTS.bat
echo.
pause

