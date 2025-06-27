// server/routes/buckets.js - Complete working version with Cloud Storage
import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import { validateImageUpload, imageUploadRateLimit } from '../middleware/validation.js';
import cloudStorageService from '../services/cloudStorageService.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
});

// Health check for bucket routes and Cloud Storage
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await cloudStorageService.healthCheck();
    
    res.json({
      success: true,
      message: 'Bucket routes are working',
      cloudStorage: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Upload single image
router.post('/upload', 
  auth, 
  imageUploadRateLimit,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const { folder = 'pets', petId } = req.body;
      
      const result = await cloudStorageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        folder,
        petId
      );

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: result
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message
      });
    }
  }
);

// Upload multiple images
router.post('/upload-multiple',
  auth,
  imageUploadRateLimit,
  upload.array('images', 5), // Max 5 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided'
        });
      }

      const { folder = 'pets', petId } = req.body;
      
      const result = await cloudStorageService.uploadMultipleImages(
        req.files,
        folder,
        petId
      );

      res.status(201).json({
        success: true,
        message: 'Images uploaded successfully',
        data: result
      });

    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: error.message
      });
    }
  }
);

// List images in bucket
router.get('/images',
  auth,
  async (req, res) => {
    try {
      const { folder = '', limit = 100 } = req.query;
      
      const images = await cloudStorageService.listImages(folder, parseInt(limit));
      
      res.json({
        success: true,
        data: images,
        count: images.length
      });

    } catch (error) {
      console.error('List images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list images',
        error: error.message
      });
    }
  }
);

// Delete image
router.delete('/images/:fileName',
  auth,
  async (req, res) => {
    try {
      // Decode the filename in case it contains special characters
      const fileName = decodeURIComponent(req.params.fileName);
      
      const result = await cloudStorageService.deleteImage(fileName);
      
      res.json({
        success: true,
        message: 'Image deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: error.message
      });
    }
  }
);

// Get signed URL for temporary access
router.post('/signed-url',
  auth,
  async (req, res) => {
    try {
      const { fileName, expirationMinutes = 60 } = req.body;
      
      if (!fileName) {
        return res.status(400).json({
          success: false,
          message: 'File name is required'
        });
      }
      
      const url = await cloudStorageService.generateSignedUrl(fileName, expirationMinutes);
      
      res.json({
        success: true,
        data: { signedUrl: url, expiresIn: `${expirationMinutes} minutes` }
      });

    } catch (error) {
      console.error('Signed URL error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate signed URL',
        error: error.message
      });
    }
  }
);

// Get bucket info
router.get('/info',
  auth,
  async (req, res) => {
    try {
      const healthStatus = await cloudStorageService.healthCheck();
      
      res.json({
        success: true,
        message: 'Bucket information',
        data: {
          bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME,
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          ...healthStatus
        }
      });
    } catch (error) {
      console.error('Bucket info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bucket info',
        error: error.message
      });
    }
  }
);

export default router;