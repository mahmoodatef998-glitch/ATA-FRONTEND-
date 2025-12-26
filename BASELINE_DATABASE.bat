@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Baseline Existing Database
echo ========================================
echo.

REM Use Session Pooler
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will mark all existing migrations as applied.
echo This is safe if your database already has the schema.
echo.
echo Press any key to continue...
pause > nul

echo.
echo [1/2] Marking all migrations as applied...
echo.

REM Get list of migration folders
for /d %%d in (prisma\migrations\*) do (
    echo Marking migration: %%d
    call npx prisma migrate resolve --applied "%%~nxd" --schema=prisma/schema.prisma
)

echo.
echo [2/2] Syncing schema with db push...
echo ⚠️  This will create all missing tables...
echo.

REM Use echo to auto-answer "y" to prompts
echo y | call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate

if errorlevel 1 (
    echo.
    echo ❌ Schema sync failed!
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
echo   Database Baseline Complete!
echo ========================================
echo.
echo Now you can run:
echo   CHECK_ADMIN_EXISTS.bat
echo.
pause

