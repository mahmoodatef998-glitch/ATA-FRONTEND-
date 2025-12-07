import sharp from "sharp";
import { isImage } from "./file-validator";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: "jpeg",
};

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image buffer
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Buffer> {
  if (!isImage(file)) {
    throw new Error("File is not an image");
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    let image = sharp(buffer);

    // Get metadata
    const metadata = await image.metadata();

    // Resize if needed
    if (
      (metadata.width && metadata.width > (opts.maxWidth || Infinity)) ||
      (metadata.height && metadata.height > (opts.maxHeight || Infinity))
    ) {
      image = image.resize(opts.maxWidth, opts.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Apply compression based on format
    switch (opts.format) {
      case "jpeg":
        image = image.jpeg({ quality: opts.quality, mozjpeg: true });
        break;
      case "png":
        image = image.png({ quality: opts.quality, compressionLevel: 9 });
        break;
      case "webp":
        image = image.webp({ quality: opts.quality });
        break;
    }

    return await image.toBuffer();
  } catch (error) {
    console.error("Image compression error:", error);
    // Return original if compression fails
    return buffer;
  }
}

/**
 * Get optimal file extension for compressed image
 */
export function getCompressedExtension(
  originalFilename: string,
  format?: "jpeg" | "png" | "webp"
): string {
  const baseName = originalFilename.split(".").slice(0, -1).join(".");
  const ext = format || "jpeg";
  return `${baseName}.${ext}`;
}

/**
 * Check if compression is beneficial
 * Returns true if file should be compressed
 */
export function shouldCompress(file: File): boolean {
  // Only compress images
  if (!isImage(file)) return false;

  // Don't compress already small images (< 500KB)
  if (file.size < 500 * 1024) return false;

  // Don't compress SVG
  if (file.type === "image/svg+xml") return false;

  return true;
}



