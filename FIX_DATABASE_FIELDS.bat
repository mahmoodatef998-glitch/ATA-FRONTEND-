@echo off
echo ========================================
echo Fixing Database - Adding Profile Fields
echo ========================================
echo.

echo Step 1: Pushing schema changes to database...
npx prisma db push

echo.
echo Step 2: Regenerating Prisma Client...
npx prisma generate

echo.
echo ========================================
echo Done! Please restart your server.
echo ========================================
pause

