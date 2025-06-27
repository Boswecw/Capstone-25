// server/routes/user.js - Simplified Working Version
import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import {
  handleValidationErrors,
  sanitizeInput,
  authRateLimit,
} from '../middleware/validation.js';

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// ✨ VALIDATION MIDDLEWARE ✨
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number')
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ========================================
// 🔓 PUBLIC ROUTES - Basic Implementation
// ========================================
router.post('/register', 
  authRateLimit,
  registerValidation, 
  handleValidationErrors,
  async (req, res) => {
    try {
      // Basic registration logic - implement as needed
      res.status(201).json({
        success: true,
        message: 'User registration endpoint - implement in controller'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }
);

router.post('/login', 
  authRateLimit,
  loginValidation, 
  handleValidationErrors,
  async (req, res) => {
    try {
      // Basic login logic - implement as needed
      res.json({
        success: true,
        message: 'User login endpoint - implement in controller'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }
);

// ========================================
// 🔐 PROTECTED USER ROUTES
// ========================================
router.get('/profile', 
  auth, 
  async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'User profile endpoint',
        user: req.user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }
);

// Health check endpoint for users
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User routes are working',
    timestamp: new Date().toISOString()
  });
});

export default router;
