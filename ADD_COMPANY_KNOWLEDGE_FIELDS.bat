@echo off
echo ========================================
echo Adding Company Knowledge Fields
echo ========================================
echo.
echo This will add new fields to companies table for chatbot knowledge base.
echo.
pause

echo.
echo [1/2] Running SQL migration...
psql %DATABASE_URL% -f scripts\add-company-knowledge-fields.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ SQL migration failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo [2/2] Syncing Prisma schema...
npx prisma db push

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Prisma sync failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Company Knowledge Fields Added!
echo ========================================
echo.
echo Next steps:
echo 1. Update company information in dashboard
echo 2. Test chatbot with company knowledge
echo.
pause

