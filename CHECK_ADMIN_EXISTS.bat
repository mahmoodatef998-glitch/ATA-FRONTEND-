@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Check if Admin User Exists
echo ========================================
echo.

REM Set Database URL - Direct connection (for migrations and scripts)
REM ⚠️ IMPORTANT: Get the correct URL from Supabase Dashboard
REM Settings → Database → Connection string → URI
REM Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
REM Replace [PROJECT_REF] with your actual project reference
REM Try Pooler Connection (more reliable for external connections)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

REM If Pooler Connection fails, try Direct Connection:
REM set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Checking database for admin user...
echo Database URL: %DIRECT_URL%
echo.

REM Use full path to script
if exist "%~dp0scripts\check-admin.ts" (
    call npx tsx "%~dp0scripts\check-admin.ts"
) else (
    echo ❌ Error: Cannot find scripts\check-admin.ts
    echo    Current directory: %CD%
    echo    Script directory: %~dp0
    echo    Please make sure you're running this from the project root.
    exit /b 1
)

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Error occurred!
    echo ========================================
    echo.
    echo Possible issues:
    echo   1. Database URL incorrect
    echo   2. Database credentials wrong
    echo   3. Database not accessible
    echo.
    echo Please check:
    echo   - DIRECT_URL is correct
    echo   - Database password is correct
    echo   - Database is accessible
    echo.
)

echo.
pause

