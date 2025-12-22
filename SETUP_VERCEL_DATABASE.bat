@echo off
echo ========================================
echo   Setup Vercel Database (Supabase)
echo ========================================
echo.
echo This script will:
echo 1. Run Prisma migrations
echo 2. Seed the database with initial data
echo.
echo Press any key to continue...
pause > nul

echo.
echo [1/3] Setting DATABASE_URL...
REM Use Direct Connection for migrations (best for schema changes)
set DIRECT_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo.
echo [2/3] Running Prisma Migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo Please check your database connection.
    pause
    exit /b 1
)

echo.
echo [3/3] Seeding Database...
call npx prisma db seed
if errorlevel 1 (
    echo.
    echo ERROR: Seeding failed!
    echo This might be normal if database is already seeded.
    echo Check the error message above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Database is ready!
echo ========================================
echo.
echo Your Vercel app is now ready to use.
echo You can now access your deployed app.
echo.
pause

