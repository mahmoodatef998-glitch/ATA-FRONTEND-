@echo off
echo ========================================
echo Starting Prisma Studio...
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start Prisma Studio
echo Starting Prisma Studio on port 5556...
echo.
call npm run prisma:studio

pause

