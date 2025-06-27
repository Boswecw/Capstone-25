// server/routes/buckets.js - Updated and Secure Cloud Storage Routes
import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import { imageUploadRateLimit } from '../middleware/validation.js';
import cloudStorageService from '../services/cloudStorageService.js';

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await cloudStorageService.healthCheck();
    res.json({ success: true, message: 'Bucket routes OK', cloudStorage: healthStatus, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Health check failed', error: error.message });
  }
});

// Upload single image to GCS
router.post('/upload', auth, imageUploadRateLimit, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

    const { folder = 'pets', petId } = req.body;
    const result = await cloudStorageService.uploadImage(req.file.buffer, req.file.originalname, folder, petId);
    res.status(201).json({ success: true, message: 'Image uploaded', data: result });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});

// Upload multiple images
router.post('/upload-multiple', auth, imageUploadRateLimit, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No image files provided' });

    const { folder = 'pets', petId } = req.body;
    const result = await cloudStorageService.uploadMultipleImages(req.files, folder, petId);
    res.status(201).json({ success: true, message: 'Images uploaded', data: result });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ success: false, message: 'Multi-upload failed', error: error.message });
  }
});

// List images
router.get('/images', auth, async (req, res) => {
  try {
    const { folder = '', limit = 100 } = req.query;
    const images = await cloudStorageService.listImages(folder, parseInt(limit));
    res.json({ success: true, data: images, count: images.length });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ success: false, message: 'List failed', error: error.message });
  }
});

// Delete image by filename
router.delete('/images/:fileName', auth, async (req, res) => {
  try {
    const fileName = decodeURIComponent(req.params.fileName);
    const result = await cloudStorageService.deleteImage(fileName);
    res.json({ success: true, message: 'Image deleted', data: result });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
  }
});

// Generate signed URL
router.post('/signed-url', auth, async (req, res) => {
  try {
    const { fileName, expirationMinutes = 60 } = req.body;
    if (!fileName) return res.status(400).json({ success: false, message: 'fileName is required' });
    const minutes = Math.min(Number(expirationMinutes), 120); // Max 2 hours
    const url = await cloudStorageService.generateSignedUrl(fileName, minutes);
    res.json({ success: true, data: { signedUrl: url, expiresIn: `${minutes} minutes` } });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({ success: false, message: 'Signed URL generation failed', error: error.message });
  }
});

// Bucket info
router.get('/info', auth, async (req, res) => {
  try {
    const healthStatus = await cloudStorageService.healthCheck();
    res.json({ success: true, message: 'Bucket info', data: { bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME, projectId: process.env.GOOGLE_CLOUD_PROJECT_ID, ...healthStatus } });
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ success: false, message: 'Bucket info failed', error: error.message });
  }
});

export default router;
