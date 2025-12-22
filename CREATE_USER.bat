@echo off
echo ========================================
echo   Create New User
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

set /p USER_NAME="Enter Name: "
set /p USER_EMAIL="Enter Email: "
set /p USER_PASSWORD="Enter Password (min 8 chars): "
echo.
echo Available Roles:
echo   1. ADMIN
echo   2. OPERATIONS_MANAGER
echo   3. ACCOUNTANT
echo   4. SUPERVISOR
echo   5. TECHNICIAN
echo   6. FACTORY_SUPERVISOR
echo   7. HR
echo.
set /p ROLE_CHOICE="Select Role (1-7): "

if "%ROLE_CHOICE%"=="1" set USER_ROLE=ADMIN
if "%ROLE_CHOICE%"=="2" set USER_ROLE=OPERATIONS_MANAGER
if "%ROLE_CHOICE%"=="3" set USER_ROLE=ACCOUNTANT
if "%ROLE_CHOICE%"=="4" set USER_ROLE=SUPERVISOR
if "%ROLE_CHOICE%"=="5" set USER_ROLE=TECHNICIAN
if "%ROLE_CHOICE%"=="6" set USER_ROLE=FACTORY_SUPERVISOR
if "%ROLE_CHOICE%"=="7" set USER_ROLE=HR

set COMPANY_ID=1

echo.
echo Creating user...
echo.

call npx tsx scripts/create-user.ts

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
pause

