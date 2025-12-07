import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { handleApiError, AppError } from "@/lib/error-handler";
import { successResponse } from "@/lib/utils/api-helpers";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Require ADMIN role only
    await requireRole([UserRole.ADMIN]);

    // Create backups directory if it doesn't exist
    const backupDir = join(process.cwd(), "backups");
    try {
      await mkdir(backupDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Generate backup filename with date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    
    const backupFileName = `ata_crm_backup_${year}${month}${day}_${hour}${minute}.sql`;
    const backupPath = join(backupDir, backupFileName);

    // Execute pg_dump via Docker and capture output
    const command = `docker exec ata-crm-postgres pg_dump -U postgres ata_crm`;

    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('NOTICE')) {
        console.error("Backup stderr:", stderr);
      }

      // Write output to file
      await writeFile(backupPath, stdout, 'utf-8');
      
      return successResponse({
        fileName: backupFileName,
        path: backupPath,
        timestamp: now.toISOString(),
      });
    } catch (error: any) {
      // More detailed error message for backup-specific errors
      let errorMsg = "Failed to create backup.";
      if (error.message?.includes("docker")) {
        errorMsg = "Docker is not running. Please start Docker Desktop.";
      } else if (error.message?.includes("ata-crm-postgres") || error.message?.includes("No such container")) {
        errorMsg = "PostgreSQL container is not running. Run START.bat first.";
      } else if (error.message?.includes("permission")) {
        errorMsg = "Permission denied. Try running as Administrator.";
      }
      
      // Throw custom error with specific message
      throw new AppError(errorMsg, 500, "BACKUP_ERROR", error.message);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

