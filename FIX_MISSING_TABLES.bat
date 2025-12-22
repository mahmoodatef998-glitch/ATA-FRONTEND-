@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Fix Missing Database Tables
echo ========================================
echo.

REM Use Session Pooler
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will create all missing tables using db push.
echo.
echo Press any key to continue...
pause > nul

echo.
echo [1/2] Pushing schema to database (creating missing tables)...
echo.

call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate

if errorlevel 1 (
    echo.
    echo ❌ Schema push failed!
    echo.
    echo The error above shows which table is missing.
    echo You may need to create it manually or check migrations.
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
echo   Database Tables Fixed!
echo ========================================
echo.
echo Now you can run:
echo   CHECK_ADMIN_EXISTS.bat
echo.
pause

