@echo off
REM Automated Database Backup Script for Production (Windows)
REM Run this script via Task Scheduler for daily backups

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=backups
set DB_CONTAINER=ata-crm-postgres
set DB_NAME=ata_crm
set DB_USER=postgres
set RETENTION_DAYS=30

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Generate backup filename with timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=%BACKUP_DIR%\ata_crm_backup_%TIMESTAMP%.sql

REM Create backup
echo Creating backup: %BACKUP_FILE%
docker exec %DB_CONTAINER% pg_dump -U %DB_USER% %DB_NAME% > %BACKUP_FILE%

REM Check if backup was successful
if exist "%BACKUP_FILE%" (
    echo ✅ Backup created successfully: %BACKUP_FILE%
    
    REM Get backup size
    for %%A in ("%BACKUP_FILE%") do set BACKUP_SIZE=%%~zA
    echo Backup size: %BACKUP_SIZE% bytes
    
    REM Clean old backups (keep only last N days)
    echo Cleaning backups older than %RETENTION_DAYS% days...
    forfiles /p "%BACKUP_DIR%" /m ata_crm_backup_*.sql /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    echo ✅ Cleanup completed
) else (
    echo ❌ Backup failed!
    exit /b 1
)

endlocal

