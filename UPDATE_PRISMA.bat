@echo off
chcp 65001 >nul
echo ========================================
echo   Updating Prisma Client...
echo ========================================
echo.

echo [1/3] Stopping servers...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM tsx.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Pushing schema to database...
npx prisma db push

echo [3/3] Generating Prisma Client...
npx prisma generate

echo.
echo ========================================
echo   Prisma Client Updated!
echo ========================================
echo.
echo Now run: START.bat
echo.
pause

