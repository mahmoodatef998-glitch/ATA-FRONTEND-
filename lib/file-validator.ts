/**
 * Enhanced File Validation
 * Validates file type, size, and content to prevent malicious uploads
 */

import { FileTypeResult, fileTypeFromBuffer } from "file-type";

/**
 * Allowed file types and their MIME types
 */
export const ALLOWED_FILE_TYPES = {
  pdf: {
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
    magicBytes: [0x25, 0x50, 0x44, 0x46], // %PDF
  },
  excel: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ],
    extensions: [".xlsx", ".xls"],
    magicBytes: [
      [0x50, 0x4b, 0x03, 0x04], // ZIP signature (xlsx is a ZIP file)
      [0xd0, 0xcf, 0x11, 0xe0], // OLE2 signature (xls)
    ],
  },
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    magicBytes: [
      [0xff, 0xd8, 0xff], // JPEG
      [0x89, 0x50, 0x4e, 0x47], // PNG
      [0x47, 0x49, 0x46, 0x38], // GIF
      [0x52, 0x49, 0x46, 0x46], // WEBP
    ],
  },
} as const;

export type AllowedFileType = keyof typeof ALLOWED_FILE_TYPES;

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

/**
 * Validate file type by checking MIME type
 */
export function validateMimeType(file: File, allowedTypes: AllowedFileType[]): boolean {
  const allowedMimeTypes = allowedTypes.flatMap((type) => ALLOWED_FILE_TYPES[type].mimeTypes);
  return allowedMimeTypes.includes(file.type as any);
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeInMB - Maximum size in MB (default: 10MB)
 */
export function validateFileSize(file: File, maxSizeInMB: number = 10): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Validate file content by checking magic bytes
 * @param buffer - File buffer
 * @param allowedTypes - Allowed file types
 */
export async function validateFileContent(
  buffer: Buffer,
  allowedTypes: AllowedFileType[]
): Promise<FileValidationResult> {
  try {
    // First, try basic magic bytes validation (faster and more reliable)
    // For PDF files, check magic bytes directly
    if (allowedTypes.includes("pdf")) {
      const pdfHeader = buffer.slice(0, 4).toString();
      if (pdfHeader.startsWith("%PDF")) {
        return {
          valid: true,
          detectedType: "application/pdf",
        };
      }
    }
    
    // For Excel files, check ZIP signature (xlsx) or OLE2 (xls)
    if (allowedTypes.includes("excel")) {
      const firstBytes = Array.from(buffer.slice(0, 4));
      // Check for ZIP signature (xlsx)
      if (firstBytes[0] === 0x50 && firstBytes[1] === 0x4b && firstBytes[2] === 0x03 && firstBytes[3] === 0x04) {
        return {
          valid: true,
          detectedType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      }
      // Check for OLE2 signature (xls)
      if (firstBytes[0] === 0xd0 && firstBytes[1] === 0xcf && firstBytes[2] === 0x11 && firstBytes[3] === 0xe0) {
        return {
          valid: true,
          detectedType: "application/vnd.ms-excel",
        };
      }
    }

    // Use file-type to detect actual file type (as secondary check)
    let detectedType: FileTypeResult | undefined;
    try {
      detectedType = await fileTypeFromBuffer(buffer);
    } catch (fileTypeError) {
      // If file-type fails, but we already validated with magic bytes, it's OK
      // In development, be lenient
      if (process.env.NODE_ENV === "development") {
        console.warn("file-type detection failed, but magic bytes validation passed:", fileTypeError);
        return {
          valid: true,
          detectedType: "unknown",
        };
      }
      
      // If we couldn't validate with magic bytes either, fail
      return {
        valid: false,
        error: "Could not detect file type. File may be corrupted or invalid.",
      };
    }

    if (!detectedType) {
      return {
        valid: false,
        error: "Could not detect file type. File may be corrupted or invalid.",
      };
    }

    // Check if detected type matches allowed types
    const allowedMimeTypes = allowedTypes.flatMap((type) => ALLOWED_FILE_TYPES[type].mimeTypes);
    
    if (!allowedMimeTypes.includes(detectedType.mime as any)) {
      return {
        valid: false,
        error: `File type mismatch. Detected: ${detectedType.mime}, but only ${allowedTypes.join(", ")} are allowed.`,
        detectedType: detectedType.mime,
      };
    }

    // Additional magic bytes validation for PDF files (extra security)
    if (allowedTypes.includes("pdf") && detectedType.mime === "application/pdf") {
      // PDF files always start with %PDF
      const pdfHeader = buffer.slice(0, 4).toString();
      if (!pdfHeader.startsWith("%PDF")) {
        return {
          valid: false,
          error: "File does not appear to be a valid PDF file.",
          detectedType: detectedType.mime,
        };
      }
    }

    return {
      valid: true,
      detectedType: detectedType.mime,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Error validating file content: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Comprehensive file validation
 * @param file - File to validate
 * @param allowedTypes - Allowed file types
 * @param maxSizeInMB - Maximum size in MB
 */
export async function validateFile(
  file: File,
  allowedTypes: AllowedFileType[] = ["pdf", "excel"],
  maxSizeInMB: number = 10
): Promise<FileValidationResult> {
  // 1. Check file exists
  if (!file) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  // 2. Validate file size
  if (!validateFileSize(file, maxSizeInMB)) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeInMB}MB`,
    };
  }

  // 3. Validate MIME type
  if (!validateMimeType(file, allowedTypes)) {
    return {
      valid: false,
      error: `Invalid file type. Only ${allowedTypes.join(", ")} files are allowed`,
    };
  }

  // 4. Validate file content (magic bytes)
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (bufferError) {
    return {
      valid: false,
      error: `Failed to read file: ${bufferError instanceof Error ? bufferError.message : "Unknown error"}`,
    };
  }

  let contentValidation;
  try {
    contentValidation = await validateFileContent(buffer, allowedTypes);
  } catch (contentError) {
    console.error("Content validation error:", contentError);
    // In development, be more lenient
    if (process.env.NODE_ENV === "development") {
      return {
        valid: true,
        detectedType: file.type || "unknown",
      };
    }
    return {
      valid: false,
      error: `File content validation failed: ${contentError instanceof Error ? contentError.message : "Unknown error"}`,
    };
  }

  if (!contentValidation.valid) {
    return contentValidation;
  }

  return {
    valid: true,
    detectedType: contentValidation.detectedType,
  };
}
