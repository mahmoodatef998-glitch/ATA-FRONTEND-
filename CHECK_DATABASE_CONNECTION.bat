@echo off
echo ========================================
echo   Check Database Connection
echo ========================================
echo.
echo This will test the database connection
echo.
pause

echo.
echo [1/3] Checking DATABASE_URL in .env...
if exist .env (
    findstr /C:"DATABASE_URL" .env
    echo.
) else (
    echo ❌ .env file not found!
    pause
    exit /b 1
)

echo.
echo [2/3] Testing Prisma connection...
npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT 1 as test;"

echo.
echo [3/3] Checking Prisma Client...
npx prisma generate

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo If you see errors above, check:
echo 1. DATABASE_URL is correct
echo 2. Database is accessible
echo 3. Connection pooling is enabled
echo.
pause

