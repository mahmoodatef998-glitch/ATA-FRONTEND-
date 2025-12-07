@echo off
chcp 65001 >nul
echo ========================================
echo   إصلاح قاعدة البيانات و Prisma
echo ========================================
echo.

echo [1/4] إيقاف السيرفرات...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM tsx.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] التحقق من Schema...
echo.

echo [3/4] تحديث قاعدة البيانات (db push)...
npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [ERROR] فشل تحديث قاعدة البيانات
    pause
    exit /b 1
)

echo.
echo [4/4] تحديث Prisma Client...
npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] فشل تحديث Prisma Client
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ تم التحديث بنجاح!
echo ========================================
echo.
echo الآن شغّل: START.bat
echo.
pause

