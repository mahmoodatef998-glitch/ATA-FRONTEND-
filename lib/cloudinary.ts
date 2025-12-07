/**
 * Cloudinary Configuration
 * 
 * Cloud Storage for files (PDFs, images, etc.)
 * 
 * Setup:
 * 1. Sign up at https://cloudinary.com (free)
 * 2. Get your credentials from dashboard
 * 3. Add to .env:
 *    CLOUDINARY_CLOUD_NAME=your-cloud-name
 *    CLOUDINARY_API_KEY=your-api-key
 *    CLOUDINARY_API_SECRET=your-api-secret
 */

// Lazy import Cloudinary to avoid errors if package is not installed or misconfigured
let cloudinary: any = null;
let cloudinaryInitialized = false;

function getCloudinary() {
  if (!cloudinaryInitialized) {
    try {
      // Only import if Cloudinary is configured
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        const cloudinaryModule = require('cloudinary');
        cloudinary = cloudinaryModule.v2;
        
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true, // Use HTTPS
        });
        
        console.log('✅ Cloudinary configured successfully');
      } else {
        console.warn('⚠️ Cloudinary not configured - using local storage');
      }
    } catch (error: any) {
      console.error('❌ Failed to configure Cloudinary:', error?.message || error);
      cloudinary = null;
    }
    cloudinaryInitialized = true;
  }
  return cloudinary;
}

/**
 * Upload file to Cloudinary
 * @param file - File object or Buffer
 * @param folder - Folder name in Cloudinary (e.g., 'quotations', 'pos', 'delivery-notes')
 * @param options - Additional upload options
 * @returns Upload result with secure_url
 */
export async function uploadFile(
  file: File | Buffer,
  folder: string,
  options?: {
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
    public_id?: string;
    overwrite?: boolean;
  }
): Promise<{ secure_url: string; public_id: string }> {
  // Get Cloudinary instance (lazy loaded)
  const cloudinaryInstance = getCloudinary();
  
  // Check if Cloudinary is configured
  if (!cloudinaryInstance) {
    throw new Error('Cloudinary is not configured. Please add credentials to .env');
  }

  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Upload to Cloudinary using upload_stream for better performance
    return new Promise((resolve, reject) => {
      try {
        const uploadOptions: any = {
          resource_type: options?.resource_type || 'auto', // Let Cloudinary detect file type
          overwrite: options?.overwrite || false,
          access_mode: 'public', // CRITICAL: Make files publicly accessible (required for downloads)
          type: 'upload', // Standard upload type (not authenticated)
          invalidate: false, // Don't invalidate CDN cache
        };

        // Add public_id if provided (includes folder path)
        if (options?.public_id) {
          uploadOptions.public_id = options.public_id;
          // If public_id includes folder path, don't add folder separately
          if (!options.public_id.includes('/')) {
            // If public_id doesn't include folder, add it
            uploadOptions.folder = `ata-crm/${folder}`;
          }
        } else {
          // If no public_id provided, use folder
          uploadOptions.folder = `ata-crm/${folder}`;
        }

        // Create upload stream
        const uploadStream = cloudinaryInstance.uploader.upload_stream(
          uploadOptions,
          (error: any, result: any) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              const errorMsg = error.message || String(error);
              reject(new Error(`Cloudinary upload failed: ${errorMsg}`));
            } else if (result) {
              // Verify access_mode is public
              if (result.access_mode !== 'public') {
                console.warn(`⚠️ File uploaded but access_mode is ${result.access_mode}, expected 'public'`);
              }
              
              console.log(`✅ File uploaded to Cloudinary: ${result.secure_url}`);
              console.log(`   - Public ID: ${result.public_id}`);
              console.log(`   - Resource Type: ${result.resource_type}`);
              console.log(`   - Access Mode: ${result.access_mode || 'public'}`);
              
              // Use secure_url directly - Cloudinary returns correct URL based on resource_type
              resolve({
                secure_url: result.secure_url, // This is already a public URL
                public_id: result.public_id,
              });
            } else {
              reject(new Error('Upload failed: No result returned from Cloudinary'));
            }
          }
        );

        // Handle stream errors
        uploadStream.on('error', (streamError: any) => {
          console.error('❌ Upload stream error:', streamError);
          reject(new Error(`Upload stream error: ${streamError.message || streamError}`));
        });

        // Write buffer to stream
        uploadStream.end(buffer);
      } catch (streamError: any) {
        console.error('❌ Failed to create upload stream', streamError);
        reject(new Error(`Failed to create upload stream: ${streamError.message || streamError}`));
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to upload file to Cloudinary', error);
    throw error;
  }
}

/**
 * Delete file from Cloudinary
 * @param publicId - Public ID of the file (from upload result)
 * @returns Deletion result
 */
export async function deleteFile(publicId: string): Promise<void> {
  const cloudinaryInstance = getCloudinary();
  
  if (!cloudinaryInstance) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    await cloudinaryInstance.uploader.destroy(publicId);
    console.log(`✅ File deleted from Cloudinary: ${publicId}`);
  } catch (error: any) {
    console.error('❌ Failed to delete file from Cloudinary', error);
    throw error;
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Export cloudinary getter for advanced usage
export function getCloudinaryInstance() {
  return getCloudinary();
}

/**
 * Generate a signed URL for a Cloudinary file (for private files)
 * @param url - Cloudinary URL
 * @returns Signed URL or original URL if signing fails
 */
export function getSignedUrl(url: string): string {
  const cloudinaryInstance = getCloudinary();
  
  if (!cloudinaryInstance || !url.includes('cloudinary.com')) {
    return url; // Return original URL if not Cloudinary or not configured
  }

  try {
    // Parse Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{signature}/{version}/{public_id}
    // or: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    // Find 'upload' index
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      return url; // Invalid Cloudinary URL
    }
    
    // Get resource type (before 'upload')
    const resourceType = uploadIndex > 0 ? pathParts[uploadIndex - 1] : 'image';
    
    // Get parts after 'upload'
    const afterUpload = pathParts.slice(uploadIndex + 1);
    
    // Check if first part is a signature (starts with 's--')
    let versionIndex = 0;
    if (afterUpload[0] && afterUpload[0].startsWith('s--')) {
      versionIndex = 1; // Skip signature
    }
    
    // Get version (starts with 'v' or 'vv')
    const version = afterUpload[versionIndex]?.replace(/^vv?/, '') || null;
    
    // Get public_id (everything after version)
    const publicIdParts = afterUpload.slice(versionIndex + 1);
    let publicId = publicIdParts.join('/');
    
    // Remove file extension for public_id
    publicId = publicId.replace(/\.[^/.]+$/, '');
    
    // Generate signed URL using Cloudinary SDK
    const signedUrl = cloudinaryInstance.url(publicId, {
      resource_type: resourceType === 'raw' ? 'raw' : resourceType === 'video' ? 'video' : 'image',
      version: version,
      sign_url: true,
      secure: true,
      type: 'upload',
    });
    
    return signedUrl;
  } catch (error) {
    console.error('❌ Failed to generate signed URL:', error);
    return url; // Return original URL on error
  }
}

/**
 * Check if a Cloudinary URL needs signing (is private)
 * This is a helper function - in practice, we'll try to access the file
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') && url.includes('res.cloudinary.com');
}

/**
 * Make a Cloudinary file public
 * @param publicId - Public ID of the file (extracted from URL)
 * @param resourceType - Resource type ('image', 'raw', 'video', etc.)
 * @returns Success status
 */
export async function makeFilePublic(publicId: string, resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'): Promise<boolean> {
  const cloudinaryInstance = getCloudinary();
  
  if (!cloudinaryInstance) {
    throw new Error('Cloudinary is not configured');
  }

  console.log(`🔧 [makeFilePublic] Starting with public_id: ${publicId}, resource_type: ${resourceType}`);

  try {
    const finalResourceType = resourceType === 'auto' ? 'raw' : resourceType;
    
    // Use explicit API to update access_mode
    // Note: public_id should include the full path (e.g., "ata-crm/po/PO_01_1763807692686")
    try {
      console.log(`🔧 [makeFilePublic] Trying explicit with resource_type: ${finalResourceType}`);
      const result = await cloudinaryInstance.uploader.explicit(publicId, {
        resource_type: finalResourceType,
        type: 'upload',
        access_mode: 'public',
        overwrite: false, // Don't overwrite, just update access_mode
      });
      
      console.log(`✅ [makeFilePublic] Made file public: ${publicId}`, result);
      return true;
    } catch (explicitError: any) {
      console.error(`❌ [makeFilePublic] Explicit failed:`, {
        publicId,
        resourceType: finalResourceType,
        error: explicitError.message,
        errorCode: explicitError.http_code,
        errorName: explicitError.name,
      });
      
      // If explicit fails with "Resource not found", try with different resource types
      if (explicitError.message?.includes('not found') || explicitError.message?.includes('Resource not found') || explicitError.http_code === 404) {
        console.log(`⚠️ [makeFilePublic] Resource not found with ${finalResourceType}, trying 'image'...`);
        
        // Try with 'image' resource type (old files might be stored as images)
        try {
          const result = await cloudinaryInstance.uploader.explicit(publicId, {
            resource_type: 'image',
            type: 'upload',
            access_mode: 'public',
            overwrite: false,
          });
          
          console.log(`✅ [makeFilePublic] Made file public with 'image' type: ${publicId}`, result);
          return true;
        } catch (imageError: any) {
          console.error(`❌ [makeFilePublic] Image type also failed:`, imageError.message);
          
          // Try with 'auto' resource type
          try {
            console.log(`⚠️ [makeFilePublic] Trying 'auto' resource type...`);
            const result = await cloudinaryInstance.uploader.explicit(publicId, {
              resource_type: 'auto',
              type: 'upload',
              access_mode: 'public',
              overwrite: false,
            });
            
            console.log(`✅ [makeFilePublic] Made file public with 'auto' type: ${publicId}`, result);
            return true;
          } catch (autoError: any) {
            console.error(`❌ [makeFilePublic] All resource types failed for ${publicId}:`, {
              rawError: explicitError.message,
              imageError: imageError.message,
              autoError: autoError.message,
            });
            return false;
          }
        }
      } else {
        console.error(`❌ [makeFilePublic] Failed to make file public: ${publicId}`, explicitError);
        return false;
      }
    }
  } catch (error: any) {
    console.error(`❌ [makeFilePublic] Unexpected error: ${publicId}`, error);
    return false;
  }
}

/**
 * Extract public_id from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID and resource type
 */
export function extractPublicIdFromUrl(url: string): { publicId: string; resourceType: 'image' | 'raw' | 'video' } | null {
  if (!url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    // Find cloud name index
    const cloudNameIndex = pathParts.findIndex(part => part.includes('cloudinary') || pathParts.indexOf(part) > 0);
    
    // Find 'upload' index
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      return null;
    }
    
    // Resource type is before 'upload' (e.g., 'raw', 'image', 'video')
    // But if URL was modified (image -> raw), we need to detect the actual resource type
    let resourceType = uploadIndex > 0 ? pathParts[uploadIndex - 1] : 'image';
    
    // If resource type is 'raw' but URL contains '.pdf', it might have been modified
    // Try to detect actual resource type from the file extension or use 'raw' for PDFs
    if (url.toLowerCase().endsWith('.pdf')) {
      resourceType = 'raw';
    }
    
    // Everything after 'upload' is version and public_id
    const afterUpload = pathParts.slice(uploadIndex + 1);
    
    // Skip signature if present (starts with 's--')
    let startIndex = 0;
    if (afterUpload[0] && afterUpload[0].startsWith('s--')) {
      startIndex = 1;
    }
    
    // Skip version (usually a number like 'v1234567890')
    // Version is usually the first element after upload (or after signature)
    if (afterUpload[startIndex] && /^v\d+$/.test(afterUpload[startIndex])) {
      startIndex += 1;
    }
    
    // Get public_id (everything after version, including folder path)
    const publicIdParts = afterUpload.slice(startIndex);
    let publicId = publicIdParts.join('/');
    
    // Remove file extension (keep folder path)
    publicId = publicId.replace(/\.[^/.]+$/, '');
    
    console.log(`🔍 Extracted public_id: ${publicId} (resource_type: ${resourceType}) from URL: ${url}`);
    
    return {
      publicId,
      resourceType: resourceType === 'raw' ? 'raw' : resourceType === 'video' ? 'video' : 'image',
    };
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}

