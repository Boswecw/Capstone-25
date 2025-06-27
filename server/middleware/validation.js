// server/middleware/validation.js

import { body, param, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import Pet from "../models/Pet.js";
import User from "../models/User.js";

// ✨ CUSTOM VALIDATORS ✨
const customValidators = {
  isPetExists: async (petId) => {
    const pet = await Pet.findById(petId);
    if (!pet) throw new Error("Pet not found");
    return true;
  },

  isUserExists: async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    return true;
  },

  isEmailUnique: async (email, { req }) => {
    const existingUser = await User.findOne({ email });
    if (
      existingUser &&
      (!req.user || existingUser._id.toString() !== req.user._id.toString())
    ) {
      throw new Error("Email already in use");
    }
    return true;
  },

  isUsernameUnique: async (username, { req }) => {
    const existingUser = await User.findOne({ username });
    if (
      existingUser &&
      (!req.user || existingUser._id.toString() !== req.user._id.toString())
    ) {
      throw new Error("Username already taken");
    }
    return true;
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


// VALIDATORS
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
  });
};

const authRateLimit = createRateLimit(15 * 60 * 1000, 5, "Too many login attempts");
const contactRateLimit = createRateLimit(60 * 60 * 1000, 3, "Too many contact messages");

export {
  validateLogin,
  validateUser,
  validatePetUpdate,
  validatePasswordChange,
  validateRating,
  handleValidationErrors,
  authRateLimit,
  contactRateLimit,
  createRateLimit,
  customValidators,
};
