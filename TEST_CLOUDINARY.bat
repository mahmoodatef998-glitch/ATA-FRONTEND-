@echo off
echo ========================================
echo   Testing Cloudinary Configuration
echo ========================================
echo.
echo This will test:
echo   - Cloudinary configuration
echo   - File upload
echo   - File access
echo   - File deletion
echo.
echo ========================================
echo.

npx tsx scripts/test-cloudinary.ts

echo.
echo ========================================
echo   Done!
echo ========================================
pause

