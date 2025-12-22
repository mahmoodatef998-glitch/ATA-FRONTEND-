@echo off
echo ========================================
echo   Test Database Connection
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Testing database connection...
echo Database URL: %DIRECT_URL%
echo.

echo Step 1: Testing Prisma connection...
call npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT 1 as test;" 2>nul

if errorlevel 1 (
    echo.
    echo ❌ Connection failed!
    echo.
    echo Possible issues:
    echo   1. Database URL incorrect
    echo   2. Password incorrect
    echo   3. Database not accessible
    echo   4. Network/firewall issue
    echo.
    echo Please verify:
    echo   - Database URL in Supabase dashboard
    echo   - Password is correct
    echo   - Database is running
    echo.
) else (
    echo.
    echo ✅ Connection successful!
    echo.
    echo Now you can run:
    echo   CHECK_ADMIN_EXISTS.bat
    echo.
)

echo.
pause

