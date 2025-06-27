// server/routes/pets.js - ES6 Module Version WITH IMAGE UPLOAD SUPPORT
import express from "express";
import multer from "multer"; // ADD THIS LINE
import petController from "../controllers/petController.js";
import { auth } from "../middleware/auth.js";
import {
  validatePet,
  validatePetUpdate,
  validateRating,
  validateVote,
  validateImageUpload, // ADD THIS LINE
  handleValidationErrors,
  sanitizeInput,
  generalRateLimit,
  imageUploadRateLimit, // ADD THIS LINE
} from "../middleware/validation.js";

const router = express.Router();

// ADD THIS MULTER CONFIGURATION FOR GOOGLE CLOUD STORAGE
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
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

// ✅ Apply rate limiting and sanitization globally to pet routes
router.use(generalRateLimit);
router.use(sanitizeInput);

// 🟢 Public Routes
router.get("/", petController.getAllPets);
router.get("/featured", petController.getFeaturedPets);
router.get("/type/:type", petController.getPetsByType);
router.get("/:id", petController.getPetById);

// 🔒 Protected Routes (authentication required)

// MODIFY THIS ROUTE TO INCLUDE IMAGE UPLOAD
router.post(
  "/",
  auth,
  imageUploadRateLimit, // ADD THIS LINE
  upload.single('image'), // ADD THIS LINE
  validatePet,
  validateImageUpload, // ADD THIS LINE
  handleValidationErrors,
  petController.createPet,
);

// MODIFY THIS ROUTE TO INCLUDE IMAGE UPLOAD
router.put(
  "/:id",
  auth,
  imageUploadRateLimit, // ADD THIS LINE
  upload.single('image'), // ADD THIS LINE
  validatePetUpdate,
  validateImageUpload, // ADD THIS LINE
  handleValidationErrors,
  petController.updatePet,
);

router.delete("/:id", auth, petController.deletePet);

// MODIFY THIS ROUTE TO USE VOTING RATE LIMIT FROM CONTROLLER
router.post(
  "/:id/vote",
  auth,
  petController.votingRateLimit, // CHANGE THIS LINE
  validateVote,
  handleValidationErrors,
  petController.votePet,
);

router.post(
  "/:id/rate",
  auth,
  validateRating,
  handleValidationErrors,
  petController.ratePet,
);

// ADD THESE NEW ROUTES FOR IMAGE MANAGEMENT
// Add additional image to existing pet
router.post(
  "/:id/images",
  auth,
  imageUploadRateLimit,
  upload.single('image'),
  validateImageUpload,
  handleValidationErrors,
  petController.addImageToPet
);

// Remove specific image from pet
router.delete(
  "/:id/images/:imageId",
  auth,
  petController.removeImageFromPet
);

export default router;