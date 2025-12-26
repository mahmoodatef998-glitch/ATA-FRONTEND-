@echo off
echo ========================================
echo   Update DATABASE_URL in .env file
echo ========================================
echo.
echo This will help you update your DATABASE_URL
echo.
echo Press any key to continue...
pause >nul

echo.
echo ✅ New DATABASE_URL (with Transaction Pooler):
echo.
echo DATABASE_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require"
echo.
echo.
echo 📝 Instructions:
echo 1. Open your .env file
echo 2. Find the DATABASE_URL line
echo 3. Replace it with the line above
echo 4. Save the file
echo 5. Restart your server
echo.
echo ========================================
echo   Done! Now restart your server.
echo ========================================
pause

