/**
 * Automated Database Backup Script
 * 
 * This script creates a backup of the PostgreSQL database
 * 
 * Usage:
 *   node scripts/backup-database.js
 * 
 * Or schedule it with Windows Task Scheduler:
 *   - Run daily at 2 AM
 *   - Command: node E:\path\to\scripts\backup-database.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Parse DATABASE_URL
// Format: postgresql://user:password@host:port/database
function parseDatabaseUrl(url) {
  if (!url) {
    throw new Error('DATABASE_URL not found in .env file');
  }

  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFileName = `ata_crm_backup_${timestamp}.sql`;
const backupPath = path.join(BACKUP_DIR, backupFileName);

try {
  const dbConfig = parseDatabaseUrl(DATABASE_URL);

  // Set PGPASSWORD environment variable for pg_dump
  process.env.PGPASSWORD = dbConfig.password;

  // Build pg_dump command
  const pgDumpCommand = [
    'pg_dump',
    `-h ${dbConfig.host}`,
    `-p ${dbConfig.port}`,
    `-U ${dbConfig.user}`,
    `-d ${dbConfig.database}`,
    '-F c', // Custom format (compressed)
    `-f "${backupPath}"`,
  ].join(' ');

  console.log('🔄 Starting database backup...');
  console.log(`📁 Backup will be saved to: ${backupPath}`);

  // Execute pg_dump
  exec(pgDumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Backup failed:', error.message);
      console.error('Make sure PostgreSQL is installed and pg_dump is in PATH');
      process.exit(1);
    }

    if (stderr) {
      console.warn('⚠️  Warnings:', stderr);
    }

    // Check if backup file was created
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('✅ Backup completed successfully!');
      console.log(`📊 File size: ${fileSizeMB} MB`);
      console.log(`📁 Location: ${backupPath}`);

      // Cleanup old backups (keep last 30 days)
      cleanupOldBackups();
    } else {
      console.error('❌ Backup file was not created');
      process.exit(1);
    }
  });
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

/**
 * Cleanup old backups (keep last 30 days)
 */
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
    let deletedCount = 0;

    files.forEach((file) => {
      if (file.startsWith('ata_crm_backup_') && file.endsWith('.sql')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️  Deleted old backup: ${file}`);
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.warn('⚠️  Could not cleanup old backups:', error.message);
  }
}

