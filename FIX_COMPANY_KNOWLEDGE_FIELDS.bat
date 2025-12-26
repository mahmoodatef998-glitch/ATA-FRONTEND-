@echo off
echo ========================================
echo Fix Company Knowledge Fields
echo ========================================
echo.
echo This will add the missing fields to companies table.
echo.
echo IMPORTANT: Make sure your DATABASE_URL is correct in .env file
echo.
pause

echo.
echo [1/2] Running SQL migration...
echo.
echo Please run this SQL in Supabase SQL Editor:
echo.
echo ALTER TABLE "companies" 
echo ADD COLUMN IF NOT EXISTS "description" TEXT,
echo ADD COLUMN IF NOT EXISTS "products" TEXT,
echo ADD COLUMN IF NOT EXISTS "services" TEXT,
echo ADD COLUMN IF NOT EXISTS "contactInfo" TEXT,
echo ADD COLUMN IF NOT EXISTS "businessHours" TEXT,
echo ADD COLUMN IF NOT EXISTS "specialties" TEXT;
echo.
echo OR use the SQL file: scripts\add-company-knowledge-fields.sql
echo.
pause

echo.
echo [2/2] Syncing Prisma schema with database...
npx prisma db push

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Prisma sync failed!
    echo.
    echo Please:
    echo 1. Run the SQL script in Supabase SQL Editor first
    echo 2. Then run: npx prisma db push
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Company Knowledge Fields Added!
echo ========================================
echo.
echo Next steps:
echo 1. Refresh the company knowledge page
echo 2. Try saving the data again
echo.
pause

