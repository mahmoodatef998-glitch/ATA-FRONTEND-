@echo off
echo ========================================
echo Update Company Profile for Chatbot
echo ========================================
echo.
echo This will update the company profile with complete information:
echo - Company name and description
echo - Products and services
echo - Team and specialties
echo - Contact information
echo - Business hours
echo.
echo The chatbot will use this information to provide accurate answers.
echo.
pause

echo.
echo [1/1] Updating company profile...
npx tsx scripts/update-company-profile.ts

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Update failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Company Profile Updated!
echo ========================================
echo.
echo Next steps:
echo 1. Test the chatbot with company questions
echo 2. Update information from dashboard if needed
echo 3. Verify chatbot responses are accurate
echo.
pause

