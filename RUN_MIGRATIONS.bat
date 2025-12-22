@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Run Database Migrations
echo ========================================
echo.

REM Use Pooler Connection for migrations
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
set DATABASE_URL=%DIRECT_URL%

echo Running Prisma migrations...
echo Database URL: %DIRECT_URL%
echo.

echo [1/2] Running migrations...
call npx prisma migrate deploy --schema=prisma/schema.prisma

if errorlevel 1 (
    echo.
    echo ❌ Migration failed!
    echo.
    echo Trying with db push instead...
    echo.
    call npx prisma db push --schema=prisma/schema.prisma
    if errorlevel 1 (
        echo.
        echo ❌ Both migration methods failed!
        echo Please check the error messages above.
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

