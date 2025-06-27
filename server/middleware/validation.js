// server/middleware/validation.js - Complete Fixed ES6 Version
import { body, param, query, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import Pet from "../models/Pet.js";
import User from "../models/User.js";

// ✨ CUSTOM VALIDATORS (Define first to avoid circular dependency) ✨
const customValidators = {
  // Check if pet exists
  isPetExists: async (petId) => {
    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new Error("Pet not found");
    }
    return true;
  },

  // Check if user exists
  isUserExists: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return true;
  },

  // Check if email is unique
  isEmailUnique: async (email, { req }) => {
    const existingUser = await User.findOne({ email });

    if (existingUser && (!req.user || existingUser._id.toString() !== req.user._id.toString())) {
      throw new Error("Email already in use");
    }
    return true;
  },

  // Check if username is unique
  isUsernameUnique: async (username, { req }) => {
    const existingUser = await User.findOne({ username });

    if (existingUser && (!req.user || existingUser._id.toString() !== req.user._id.toString())) {
      throw new Error("Username already taken");
    }
    return true;
  },

  // Validate password strength
  isStrongPassword: (password) => {
    const minLength = 6;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (password.length < minLength || !hasLetter || !hasNumber) {
      throw new Error("Password must be at least 6 characters and contain at least one letter and one number");
    }
    return true;
  },
};

// ✨ PET VALIDATION ✨
const validatePet = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("type")
    .isIn(["dog", "cat", "fish", "bird", "small-pet", "supply"])
    .withMessage("Invalid pet type"),
  body("breed")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Breed must be between 1 and 100 characters"),
  body("price")
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("age")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Age is required"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("size")
    .optional()
    .isIn(["small", "medium", "large", "extra-large"])
    .withMessage("Size must be small, medium, large, or extra-large"),
  body("gender")
    .optional()
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),
  body("available")
    .optional()
    .isBoolean()
    .withMessage("Available must be true or false"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be true or false"),
  // ✨ Enhanced health info validation
  body("healthInfo.vaccinated")
    .optional()
    .isBoolean()
    .withMessage("Vaccinated status must be true or false"),
  body("healthInfo.spayed")
    .optional()
    .isBoolean()
    .withMessage("Spayed status must be true or false"),
  body("healthInfo.microchipped")
    .optional()
    .isBoolean()
    .withMessage("Microchipped status must be true or false"),
  body("healthInfo.specialNeeds")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Special needs description must be less than 200 characters"),
  // ✨ Location validation
  body("location.shelter")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Shelter name must be less than 100 characters"),
  body("location.city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City must be less than 50 characters"),
  body("location.state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State must be less than 50 characters"),
  // ✨ Characteristics validation
  body("characteristics")
    .optional()
    .isArray()
    .withMessage("Characteristics must be an array"),
  body("characteristics.*")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Each characteristic must be less than 30 characters"),
  // ✨ Tags validation
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Each tag must be less than 20 characters"),
];

// ✨ USER VALIDATION ✨
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
  body("role")
    .optional()
    .isIn(["user", "admin", "moderator"])
    .withMessage("Role must be user, admin, or moderator"),
  // ✨ Profile validation
  body("profile.firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name must be less than 50 characters"),
  body("profile.lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name must be less than 50 characters"),
  body("profile.phone")
    .optional()
    .matches(/^[\d\s\-\(\)]+$/)
    .withMessage("Please enter a valid phone number"),
  body("profile.bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters"),
  // ✨ Address validation
  body("profile.address.street")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Street address must be less than 100 characters"),
  body("profile.address.city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City must be less than 50 characters"),
  body("profile.address.state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State must be less than 50 characters"),
  body("profile.address.zipCode")
    .optional()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("ZIP code must be in format 12345 or 12345-6789"),
];

// ✨ CONTACT VALIDATION ✨
const validateContact = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("phone")
    .optional()
    .matches(/^[\d\s\-\(\)]+$/)
    .withMessage("Please enter a valid phone number"),
  body("subject")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Subject must be between 1 and 200 characters"),
  body("message")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters"),
  body("category")
    .optional()
    .isIn(["general", "adoption", "support", "complaint", "suggestion", "partnership"])
    .withMessage("Invalid category"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("relatedPet")
    .optional()
    .isMongoId()
    .withMessage("Related pet must be a valid ID")
    .custom(customValidators.isPetExists),
];

// ✨ LOGIN VALIDATION ✨
const validateLogin = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// ✨ RATING VALIDATION ✨
const validateRating = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment must be less than 500 characters"),
  param("petId")
    .isMongoId()
    .withMessage("Invalid pet ID")
    .custom(customValidators.isPetExists),
];

// ✨ VOTE VALIDATION ✨
const validateVote = [
  body("voteType")
    .isIn(["up", "down"])
    .withMessage('Vote type must be either "up" or "down"'),
  param("petId")
    .isMongoId()
    .withMessage("Invalid pet ID")
    .custom(customValidators.isPetExists),
];

// ✨ CLOUD STORAGE IMAGE VALIDATION ✨
const validateImageUpload = [
  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Image description must be less than 200 characters"),
  body("category")
    .optional()
    .isIn(["profile", "action", "medical"])
    .withMessage("Image category must be profile, action, or medical"),
  body("tags")
    .optional()
    .isString()
    .withMessage("Tags must be a comma-separated string"),
  param("petId")
    .isMongoId()
    .withMessage("Invalid pet ID")
    .custom(customValidators.isPetExists),
];

// ✨ ADMIN VALIDATION ✨
const validateAdminUserUpdate = [
  param("userId")
    .isMongoId()
    .withMessage("Invalid user ID")
    .custom(customValidators.isUserExists),
  body("role")
    .optional()
    .isIn(["user", "admin", "moderator"])
    .withMessage("Role must be user, admin, or moderator"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
  body("isVerified")
    .optional()
    .isBoolean()
    .withMessage("isVerified must be true or false"),
];

const validatePasswordReset = [
  param("userId")
    .isMongoId()
    .withMessage("Invalid user ID")
    .custom(customValidators.isUserExists),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("New password must contain at least one letter and one number"),
  body("sendEmail")
    .optional()
    .isBoolean()
    .withMessage("sendEmail must be true or false"),
];

// ✨ QUERY VALIDATION ✨
const validatePetQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("type")
    .optional()
    .isIn(["dog", "cat", "fish", "bird", "small-pet", "supply"])
    .withMessage("Invalid pet type"),
  query("size")
    .optional()
    .isIn(["small", "medium", "large", "extra-large"])
    .withMessage("Invalid size"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),
  query("available")
    .optional()
    .isBoolean()
    .withMessage("Available must be true or false"),
  query("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be true or false"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
  query("sortBy")
    .optional()
    .isIn(["name", "price", "age", "createdAt", "updatedAt", "views", "popularityScore"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc", "ascending", "descending"])
    .withMessage("Sort order must be asc, desc, ascending, or descending"),
];

// ✨ UPDATE VALIDATIONS ✨
const validatePetUpdate = [
  param("id")
    .isMongoId()
    .withMessage("Invalid pet ID")
    .custom(customValidators.isPetExists),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("type")
    .optional()
    .isIn(["dog", "cat", "fish", "bird", "small-pet", "supply"])
    .withMessage("Invalid pet type"),
  body("price")
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("available")
    .optional()
    .isBoolean()
    .withMessage("Available must be true or false"),
  body("adoptionStatus")
    .optional()
    .isIn(["available", "pending", "adopted", "hold"])
    .withMessage("Invalid adoption status"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be true or false"),
];

const validateUserUpdate = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("profile.firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name must be less than 50 characters"),
  body("profile.lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name must be less than 50 characters"),
  body("profile.phone")
    .optional()
    .matches(/^[\d\s\-\(\)]+$/)
    .withMessage("Please enter a valid phone number"),
  body("profile.bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters"),
];

// ✨ PASSWORD CHANGE VALIDATION ✨
const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("New password must contain at least one letter and one number"),
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
];

// ✨ MIDDLEWARE FUNCTIONS ✨

// Handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
      errorCount: formattedErrors.length
    });
  }

  next();
};

// Enhanced sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/onload=/gi, "")
      .replace(/onerror=/gi, "")
      .replace(/onclick=/gi, "")
      .trim();
  };

  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = sanitizeString(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map(item => 
          typeof item === "string" ? sanitizeString(item) : item
        );
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  next();
};

// Enhanced rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
};

// ✨ RATE LIMITS ✨
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  "Too many authentication attempts, please try again later",
);

const contactRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 messages
  "Too many contact form submissions, please try again later",
);

const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  "Too many requests, please try again later",
);

const imageUploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  20, // 20 uploads
  "Too many image uploads, please try again later",
);

const adminActionRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  50, // 50 admin actions
  "Too many admin actions, please try again later",
);

const passwordChangeRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 password changes
  "Too many password change attempts, please try again later",
);

// ✨ FILE UPLOAD VALIDATION ✨
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file];
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB for cloud storage
  const maxFiles = 10;

  if (files.length > maxFiles) {
    return res.status(400).json({
      success: false,
      message: `Too many files. Maximum ${maxFiles} files allowed.`,
    });
  }

  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        allowedTypes: allowedTypes
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
        maxSize: `${maxSize / (1024 * 1024)}MB`
      });
    }
  }

  next();
};

// ✨ BULK OPERATION VALIDATION ✨
const validateBulkOperation = [
  body("action")
    .isIn(["activate", "deactivate", "verify", "unverify", "unlock", "delete"])
    .withMessage("Invalid bulk action"),
  body("userIds")
    .isArray({ min: 1 })
    .withMessage("User IDs array is required and must not be empty"),
  body("userIds.*")
    .isMongoId()
    .withMessage("Invalid user ID format"),
  body("confirmAction")
    .optional()
    .isBoolean()
    .withMessage("Confirm action must be true or false"),
];

// ✨ ES6 EXPORTS ✨
export {
  // Pet validations
  validatePet,
  validatePetUpdate,
  validatePetQuery,
  
  // User validations
  validateUser,
  validateUserUpdate,
  validateLogin,
  validatePasswordChange,
  
  // Contact validations
  validateContact,
  
  // Rating and voting
  validateRating,
  validateVote,
  
  // Cloud storage
  validateImageUpload,
  validateFileUpload,
  
  // Admin validations
  validateAdminUserUpdate,
  validatePasswordReset,
  validateBulkOperation,
  
  // Middleware
  handleValidationErrors,
  sanitizeInput,
  
  // Rate limiting
  authRateLimit,
  contactRateLimit,
  generalRateLimit,
  imageUploadRateLimit,
  adminActionRateLimit,
  passwordChangeRateLimit,
  createRateLimit,
  
  // Custom validators
  customValidators,
};