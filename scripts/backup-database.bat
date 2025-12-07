@echo off
REM Automated Database Backup Script (Windows)
REM 
REM This script creates a backup of the PostgreSQL database
REM 
REM Usage:
REM   Double-click this file, or
REM   Run from command prompt: scripts\backup-database.bat
REM 
REM To schedule daily backups:
REM   1. Open Task Scheduler
REM   2. Create Basic Task
REM   3. Name: "ATA CRM Database Backup"
REM   4. Trigger: Daily at 2:00 AM
REM   5. Action: Start a program
REM   6. Program: node
REM   7. Arguments: E:\path\to\scripts\backup-database.js
REM   8. Start in: E:\path\to\project

echo ========================================
echo   ATA CRM - Database Backup
echo ========================================
echo.

cd /d "%~dp0\.."
node scripts\backup-database.js

echo.
echo ========================================
echo   Backup completed!
echo ========================================
pause

