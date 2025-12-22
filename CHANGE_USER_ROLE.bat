@echo off
echo ========================================
echo   Change User Role
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

set /p USER_EMAIL="Enter User Email: "
echo.
echo Available Roles:
echo   1. ADMIN
echo   2. OPERATIONS_MANAGER
echo   3. ACCOUNTANT
echo   4. SUPERVISOR
echo   5. TECHNICIAN
echo   6. FACTORY_SUPERVISOR
echo   7. HR
echo   8. SALES_REP
echo   9. CLIENT
echo.
set /p ROLE_CHOICE="Select New Role (1-9): "

if "%ROLE_CHOICE%"=="1" set NEW_ROLE=ADMIN
if "%ROLE_CHOICE%"=="2" set NEW_ROLE=OPERATIONS_MANAGER
if "%ROLE_CHOICE%"=="3" set NEW_ROLE=ACCOUNTANT
if "%ROLE_CHOICE%"=="4" set NEW_ROLE=SUPERVISOR
if "%ROLE_CHOICE%"=="5" set NEW_ROLE=TECHNICIAN
if "%ROLE_CHOICE%"=="6" set NEW_ROLE=FACTORY_SUPERVISOR
if "%ROLE_CHOICE%"=="7" set NEW_ROLE=HR
if "%ROLE_CHOICE%"=="8" set NEW_ROLE=SALES_REP
if "%ROLE_CHOICE%"=="9" set NEW_ROLE=CLIENT

echo.
echo Changing user role...
echo.

call npx tsx scripts/change-user-role.ts

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
pause

