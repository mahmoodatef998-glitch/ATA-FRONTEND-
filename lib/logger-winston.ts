/**
 * Enhanced Winston Logger
 * Production-ready logging with file rotation and multiple transports
 * 
 * NOTE: This file uses Node.js modules (fs, path) and should NOT be imported
 * in Edge Runtime (middleware). Use '@/lib/logger-edge' for Edge Runtime.
 */

// Check if we're in Edge Runtime
const isEdgeRuntime = 
  (typeof (globalThis as any).EdgeRuntime !== 'undefined') || 
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge') ||
  (typeof process === 'undefined');

// Only import Node.js modules if not in Edge Runtime
let winston: any;
let path: any;
let fs: any;
let logsDir: string = '';

if (!isEdgeRuntime && typeof require !== 'undefined') {
  try {
    winston = require("winston");
    path = require("path");
    fs = require("fs");
    
    // Create logs directory if it doesn't exist
    logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (error) {
    // If we can't load Node.js modules, we're probably in Edge Runtime
    // This should not happen, but handle gracefully
    console.warn('Winston logger not available in Edge Runtime');
  }
}

// Only create logger if not in Edge Runtime and winston is available
let logger: any;

if (!isEdgeRuntime && winston) {
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  // Define console format (human-readable for development)
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp, ...metadata }: any) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    })
  );

  // Create transports
  const transports: any[] = [
    // Console transport (for development)
    new winston.transports.Console({
      format: process.env.NODE_ENV === "production" ? logFormat : consoleFormat,
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    }),
  ];

  // Add file transports in production
  if (process.env.NODE_ENV === "production" && path && fs && logsDir) {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "combined.log"),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  // Create logger instance
  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
    format: logFormat,
    defaultMeta: { service: "ata-crm" },
    transports,
    // Handle exceptions (only if file system is available)
    exceptionHandlers: process.env.NODE_ENV === "production" && path && fs && logsDir ? [
      new winston.transports.File({
        filename: path.join(logsDir, "exceptions.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : [],
    // Handle rejections (only if file system is available)
    rejectionHandlers: process.env.NODE_ENV === "production" && path && fs && logsDir ? [
      new winston.transports.File({
        filename: path.join(logsDir, "rejections.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : [],
  });
} else {
  // Fallback logger for Edge Runtime (console only)
  logger = {
    info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
    warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
    error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || ''),
    debug: (msg: string, meta?: any) => console.debug(`[DEBUG] ${msg}`, meta || ''),
  };
}

export { logger };

// Export convenience methods
export const logError = (message: string, error?: Error | unknown, metadata?: Record<string, any>) => {
  logger.error(message, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
  });
};

export const logWarn = (message: string, metadata?: Record<string, any>) => {
  logger.warn(message, metadata);
};

export const logInfo = (message: string, metadata?: Record<string, any>) => {
  logger.info(message, metadata);
};

export const logDebug = (message: string, metadata?: Record<string, any>) => {
  logger.debug(message, metadata);
};

