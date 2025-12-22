@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Test Database Connection
echo ========================================
echo.

REM ⚠️ IMPORTANT: Get the correct URL from Supabase Dashboard
REM Settings → Database → Connection string → URI
REM Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
REM Replace [PROJECT_REF] with your actual project reference
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Testing database connection...
echo Database URL: %DIRECT_URL%
echo.
echo Current directory: %CD%
echo.

echo Step 1: Testing Prisma connection...
echo.

REM Use full path to script
if exist "%~dp0scripts\test-connection.ts" (
    call npx tsx "%~dp0scripts\test-connection.ts"
) else (
    echo ❌ Error: Cannot find scripts\test-connection.ts
    echo    Current directory: %CD%
    echo    Script directory: %~dp0
    echo    Please make sure you're running this from the project root.
    exit /b 1
)

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Connection Failed!
    echo ========================================
    echo.
    echo Please check the error message above.
    echo.
) else (
    echo.
    echo ========================================
    echo   Connection Successful!
    echo ========================================
    echo.
    echo Now you can run:
    echo   CHECK_ADMIN_EXISTS.bat
    echo.
)

echo.
pause
