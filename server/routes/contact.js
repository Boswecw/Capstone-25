// server/routes/contact.js - Working version without missing dependencies
import express from 'express';
import { body } from 'express-validator';
import {
  handleValidationErrors,
  sanitizeInput,
  contactRateLimit,
} from '../middleware/validation.js';

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Contact form validation
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
];

// Public contact form submission
router.post('/',
  contactRateLimit,
  validateContact,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, subject } = req.body;

      // Basic contact form logic - you can enhance this later
      console.log('📧 Contact form submission:', { name, email, subject });

      // TODO: Save to database, send email, etc.

      res.status(201).json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        data: {
          name,
          email,
          subject: subject || 'General Inquiry',
          submittedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit contact form',
        error: error.message
      });
    }
  }
);

// Health check for contact routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Contact routes are working',
    timestamp: new Date().toISOString()
  });
});

export default router;
