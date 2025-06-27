// server/routes/pets.js - ES6 Module Version WITH IMAGE UPLOAD SUPPORT
import express from "express";
import multer from "multer";
import petController from "../controllers/petController.js";
import { auth } from "../middleware/auth.js";
import {
  validatePet,
  validatePetUpdate,
  validateRating,
  validateVote,
  validateImageUpload,
  handleValidationErrors,
  sanitizeInput,
  generalRateLimit,
  imageUploadRateLimit,
} from "../middleware/validation.js";

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5,
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

// Apply global middleware
router.use(generalRateLimit);
router.use(sanitizeInput);

// Public Routes
router.get("/", petController.getAllPets);
router.get("/featured", petController.getFeaturedPets);
router.get("/type/:type", petController.getPetsByType);
router.get("/:id", petController.getPetById);

// Protected Routes
router.post(
  "/",
  auth,
  imageUploadRateLimit,
  upload.single('image'),
  validatePet,
  validateImageUpload,
  handleValidationErrors,
  petController.createPet
);

router.put(
  "/:id",
  auth,
  imageUploadRateLimit,
  upload.single('image'),
  validatePetUpdate,
  validateImageUpload,
  handleValidationErrors,
  petController.updatePet
);

router.delete("/:id", auth, petController.deletePet);

router.post(
  "/:id/vote",
  auth,
  petController.votingRateLimit,
  validateVote,
  handleValidationErrors,
  petController.votePet
);

router.post(
  "/:id/rate",
  auth,
  validateRating,
  handleValidationErrors,
  petController.ratePet
);

// Image Management Routes
router.post(
  "/:id/images",
  auth,
  imageUploadRateLimit,
  upload.single('image'),
  validateImageUpload,
  handleValidationErrors,
  petController.addImageToPet
);

router.delete(
  "/:id/images/:imageId",
  auth,
  petController.removeImageFromPet
);

export default router;
