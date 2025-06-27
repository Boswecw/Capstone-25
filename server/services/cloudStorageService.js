// server/services/cloudStorageService.js - ES6 Module Version
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// ES6 module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CloudStorageService {
  constructor() {
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      // Option 1: Use service account key file (for local development)
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || path.join(__dirname, '../config/google-cloud-storage-key.json'),
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      
      // Option 2: Use Application Default Credentials (for production)
      // This will automatically use environment credentials on Render/GCP
    });
    
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'furbabies-pet-images';
    this.bucket = this.storage.bucket(this.bucketName);
    
    console.log(`🪣 Cloud Storage initialized - Bucket: ${this.bucketName}`);
  }

  // Test connection to bucket
  async testConnection() {
    try {
      const [exists] = await this.bucket.exists();
      if (!exists) {
        console.warn(`⚠️  Bucket '${this.bucketName}' does not exist`);
        return false;
      }
      console.log(`✅ Successfully connected to bucket: ${this.bucketName}`);
      return true;
    } catch (error) {
      console.error('❌ Cloud Storage connection failed:', error.message);
      return false;
    }
  }

  // Upload image to Cloud Storage
  async uploadImage(fileBuffer, originalName, folder = 'pets', petId = null) {
    try {
      const fileExtension = path.extname(originalName);
      const uniqueId = uuidv4();
      const timestamp = Date.now();
      
      // Create unique filename
      const fileName = petId 
        ? `${folder}/${petId}-${timestamp}-${uniqueId}${fileExtension}`
        : `${folder}/${timestamp}-${uniqueId}${fileExtension}`;

      const file = this.bucket.file(fileName);
      
      // Upload options
      const options = {
        metadata: {
          contentType: this.getContentType(fileExtension),
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
          metadata: {
            originalName: originalName,
            uploadedAt: new Date().toISOString(),
            petId: petId || 'unknown',
            folder: folder,
            uploadedBy: 'furbabies-app'
          }
        },
        resumable: fileBuffer.length > 5 * 1024 * 1024, // Use resumable for files > 5MB
      };

      // Upload the file
      await file.save(fileBuffer, options);

      // Make file publicly accessible
      await file.makePublic();

      // Return file information
      const result = {
        fileName: fileName,
        originalName: originalName,
        publicUrl: `https://storage.googleapis.com/${this.bucketName}/${fileName}`,
        gsUrl: `gs://${this.bucketName}/${fileName}`,
        bucketName: this.bucketName,
        size: fileBuffer.length,
        contentType: this.getContentType(fileExtension),
        uploadDate: new Date(),
        folder: folder,
        petId: petId
      };

      console.log(`📤 Uploaded: ${originalName} → ${fileName}`);
      return result;

    } catch (error) {
      console.error('❌ Cloud Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Generate and upload thumbnail
  async uploadThumbnail(imageBuffer, originalFileName, folder = 'thumbnails') {
    try {
      // Import sharp dynamically (optional dependency)
      const sharp = await import('sharp').catch(() => null);
      
      if (!sharp) {
        console.warn('⚠️  Sharp not installed - skipping thumbnail generation');
        return null;
      }
      
      // Resize image to thumbnail (300x300, maintain aspect ratio)
      const thumbnailBuffer = await sharp.default(imageBuffer)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await this.uploadImage(
        thumbnailBuffer, 
        `thumb-${originalFileName}`, 
        folder
      );

      console.log(`🖼️  Thumbnail created: ${originalFileName}`);
      return result;
    } catch (error) {
      console.error('❌ Thumbnail creation error:', error);
      // Don't throw - thumbnails are optional
      return null;
    }
  }

  // Delete image from bucket
  async deleteImage(fileName) {
    try {
      await this.bucket.file(fileName).delete();
      console.log(`🗑️  Deleted: ${fileName}`);
      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Get image metadata
  async getImageMetadata(fileName) {
    try {
      const file = this.bucket.file(fileName);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }

  // List images in folder
  async listImages(folder = '', maxResults = 100) {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: folder,
        maxResults: maxResults,
      });

      return files.map(file => ({
        name: file.name,
        publicUrl: `https://storage.googleapis.com/${this.bucketName}/${file.name}`,
        size: parseInt(file.metadata.size),
        contentType: file.metadata.contentType,
        timeCreated: file.metadata.timeCreated,
        updated: file.metadata.updated,
        folder: folder
      }));
    } catch (error) {
      throw new Error(`Failed to list images: ${error.message}`);
    }
  }

  // Generate signed URL for temporary access (useful for private files)
  async generateSignedUrl(fileName, expirationMinutes = 60) {
    try {
      const file = this.bucket.file(fileName);
      
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });

      return url;
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // Helper method to determine content type
  getContentType(fileExtension) {
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml'
    };
    return contentTypes[fileExtension.toLowerCase()] || 'image/jpeg';
  }

  // Batch upload multiple images
  async uploadMultipleImages(files, folder = 'pets', petId = null) {
    const results = [];
    const errors = [];

    console.log(`📤 Starting batch upload of ${files.length} files...`);

    for (const file of files) {
      try {
        const result = await this.uploadImage(
          file.buffer, 
          file.originalname, 
          folder, 
          petId
        );
        results.push(result);
        
        // Optionally create thumbnail
        const thumbnail = await this.uploadThumbnail(
          file.buffer, 
          file.originalname, 
          `${folder}/thumbnails`
        );
        if (thumbnail) {
          result.thumbnail = thumbnail;
        }
        
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    console.log(`✅ Batch upload complete: ${results.length} successful, ${errors.length} failed`);
    return { results, errors };
  }

  // Validate image file
  isValidImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    return true;
  }
}

// Create singleton instance
const cloudStorageService = new CloudStorageService();

// Test connection on startup
cloudStorageService.testConnection().catch(err => {
  console.warn('⚠️  Cloud Storage not available:', err.message);
});

export default cloudStorageService;