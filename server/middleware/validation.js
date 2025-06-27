// server/middleware/validation.js - Complete Updated Version

import { body, param, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import Pet from "../models/Pet.js";
import User from "../models/User.js";

// ✨ CUSTOM VALIDATORS ✨
const customValidators = {
  isPetExists: async (petId) => {
    try {
      const pet = await Pet.findById(petId);
      if (!pet) throw new Error("Pet not found");
      return true;
    } catch (error) {
      throw new Error("Pet not found");
    }
  },

  isUserExists: async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");
      return true;
    } catch (error) {
      throw new Error("User not found");
    }
  },

  isEmailUnique: async (email, { req }) => {
    try {
      const existingUser = await User.findOne({ email });
      if (
        existingUser &&
        (!req.user || existingUser._id.toString() !== req.user._id.toString())
      ) {
        throw new Error("Email already in use");
      }
      return true;
    } catch (error) {
      throw new Error("Email already in use");
    }
  },

  isUsernameUnique: async (username, { req }) => {
    try {
      const existingUser = await User.findOne({ username });
      if (
        existingUser &&
        (!req.user || existingUser._id.toString() !== req.user._id.toString())
      ) {
        throw new Error("Username already taken");
      }
      return true;
    } catch (error) {
      throw new Error("Username already taken");
    }
  },

  isStrongPassword: (password) => {
    const minLength = 6;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (password.length < minLength || !hasLetter || !hasNumber) {
      throw new Error("Password must be at least 6 characters and contain both letters and numbers");
    }
    return true;
  }
};

// Pet validation rules
const validatePet = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Pet name must be between 2 and 50 characters'),
  body('type')
    .isIn(['dog', 'cat', 'bird', 'fish', 'rabbit', 'other'])
    .withMessage('Invalid pet type'),
  body('breed')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Breed name must be less than 50 characters'),
  body('age')
    .isInt({ min: 0, max: 30 })
    .withMessage('Age must be between 0 and 30 years'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];

// Contact form validation
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
];

// User validation rules
const validateLogin = [
  body("identifier").trim().notEmpty().withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateUser = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .custom(customValidators.isUsernameUnique),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email")
    .custom(customValidators.isEmailUnique),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
];

const validatePetUpdate = [
  param("id")
    .isMongoId()
    .withMessage("Invalid pet ID")
    .custom(customValidators.isPetExists),
];

const validatePasswordChange = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("New password must contain at least one letter and one number"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match");
    }
    return true;
  }),
];

const validateRating = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  param("petId")
    .isMongoId()
    .withMessage("Invalid pet ID")
    .custom(customValidators.isPetExists),
];

// Vote validation
const validateVote = [
  param("petId")
    .isMongoId()
    .withMessage("Invalid pet ID")
    .custom(customValidators.isPetExists),
  body("vote")
    .isIn(['up', 'down'])
    .withMessage("Vote must be 'up' or 'down'"),
];

// Image upload validation
const validateImageUpload = [
  body('folder')
    .optional()
    .isIn(['pets', 'users', 'products'])
    .withMessage('Invalid folder type'),
  body('petId')
    .optional()
    .isMongoId()
    .withMessage('Invalid pet ID format'),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Basic input sanitization
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, ''); // Remove basic HTML tags
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// RATE LIMIT HELPERS
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiting middleware
const authRateLimit = createRateLimit(15 * 60 * 1000, 5, "Too many login attempts");
const contactRateLimit = createRateLimit(60 * 60 * 1000, 3, "Too many contact messages");
const generalRateLimit = createRateLimit(15 * 60 * 1000, 100, "Too many requests from this IP");
const strictRateLimit = createRateLimit(15 * 60 * 1000, 5, "Too many attempts from this IP");
const imageUploadRateLimit = createRateLimit(60 * 60 * 1000, 10, "Too many image uploads");

// Export all validation functions and middleware
export {
  validateLogin,
  validateUser,
  validatePet,
  validateContact,
  validatePetUpdate,
  validatePasswordChange,
  validateRating,
  validateVote,
  validateImageUpload,
  handleValidationErrors,
  sanitizeInput,
  authRateLimit,
  contactRateLimit,
  generalRateLimit,
  strictRateLimit,
  imageUploadRateLimit,
  createRateLimit,
  customValidators,
};