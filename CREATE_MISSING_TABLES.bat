@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Create Missing Database Tables
echo ========================================
echo.

REM Use Session Pooler
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will create missing tables using SQL.
echo.

echo [1/3] Creating audit_logs table...
echo.

REM Use psql or Prisma to execute SQL
call npx prisma db execute --file=CREATE_AUDIT_LOGS_TABLE.sql --schema=prisma/schema.prisma

if errorlevel 1 (
    echo.
    echo ⚠️  SQL execution failed. Trying alternative method...
    echo.
    REM Try using Prisma Studio or direct SQL
    echo Please run this SQL manually in Supabase SQL Editor:
    echo.
    type CREATE_AUDIT_LOGS_TABLE.sql
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Syncing remaining schema with db push...
echo.

call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate

if errorlevel 1 (
    echo.
    echo ⚠️  Schema sync failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo [3/3] Generating Prisma Client...
call npx prisma generate --schema=prisma/schema.prisma

if errorlevel 1 (
    echo.
    echo ❌ Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Database Tables Created!
echo ========================================
echo.
echo Now you can run:
echo   CHECK_ADMIN_EXISTS.bat
echo.
pause

