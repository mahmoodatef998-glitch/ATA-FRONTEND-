@echo off
echo ========================================
echo   Finding Correct Cloudinary Cloud Name
echo ========================================
echo.
echo This will test different Cloud Name variations
echo.
echo ========================================
echo.

npx tsx scripts/find-cloudinary-name.ts

echo.
echo ========================================
echo   Instructions
echo ========================================
echo.
echo If none worked, please:
echo 1. Open https://cloudinary.com/console
echo 2. Go to Settings ^> Account Details
echo 3. Copy the EXACT Cloud Name
echo 4. Update .env file
echo.
pause

