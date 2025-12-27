@echo off
echo ========================================
echo   Merge Main to Cleanup-Hooks
echo ========================================
echo.
echo This script will guide you through merging main into cleanup-hooks
echo.
echo Press any key to continue...
pause >nul

echo.
echo [Step 1] Checking current branch...
git status
echo.
echo Press any key to continue...
pause >nul

echo.
echo [Step 2] Fetching latest changes from GitHub...
git fetch frontend main
git fetch frontend cleanup-hooks
echo.
echo Press any key to continue...
pause >nul

echo.
echo [Step 3] Showing recent commits in main...
git log frontend/main --oneline -5
echo.
echo Press any key to continue...
pause >nul

echo.
echo [Step 4] Showing recent commits in cleanup-hooks...
git log cleanup-hooks --oneline -5
echo.
echo Press any key to continue...
pause >nul

echo.
echo [Step 5] Attempting merge...
echo.
echo ⚠️  If conflicts occur, you'll need to resolve them manually
echo.
git merge frontend/main

echo.
echo ========================================
echo   Merge Complete!
echo ========================================
echo.
echo Next steps:
echo 1. If conflicts occurred, resolve them manually
echo 2. Run: git add .
echo 3. Run: git commit -m "Merge main into cleanup-hooks"
echo 4. Run: git push frontend cleanup-hooks
echo 5. Test the Dashboard
echo.
pause

