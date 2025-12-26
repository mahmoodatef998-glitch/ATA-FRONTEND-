@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Run Database Migrations
echo ========================================
echo.

REM Try Session Pooler first (more reliable for external connections)
REM If this fails, try Direct Connection below
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

REM If Session Pooler fails, uncomment this line and comment the one above:
REM set DIRECT_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
REM set DATABASE_URL=%DIRECT_URL%

echo Running Prisma migrations...
echo Database URL: %DIRECT_URL%
echo.

echo [1/2] Running migrations...
call npx prisma migrate deploy --schema=prisma/schema.prisma

if errorlevel 1 (
    echo.
    echo ⚠️  Migration failed - Database schema is not empty.
    echo.
    echo Trying db push to sync schema (this will update existing schema)...
    echo ⚠️  Warning: This may remove old enum values (USER, BROKER, SUPERADMIN)
    echo.
    REM Use echo to auto-answer "y" to prompts
    echo y | call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate
    
    if errorlevel 1 (
        echo.
        echo ❌ Schema sync failed!
        echo.
        echo Please check the error messages above.
        echo You may need to run: BASELINE_DATABASE.bat
        pause
        exit /b 1
    )
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
echo   Migrations Complete!
echo ========================================
echo.
echo Now you can run:
echo   CHECK_ADMIN_EXISTS.bat
echo.
pause

