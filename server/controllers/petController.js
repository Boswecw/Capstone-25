// server/controllers/petController.js - Complete ES6 Module Version with Google Cloud Storage
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import Pet from "../models/Pet.js";
import User from "../models/User.js";
import cloudStorageService from '../services/cloudStorageService.js';

// Rate limiter for voting/ratings
const votingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many voting attempts, please try again later.",
  },
});

const getPetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pet ID format" });
    }

    const pet = await Pet.findById(id)
      .populate("createdBy", "username email")
      .populate("ratings.user", "username");

    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    console.error("Error fetching pet:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pet",
      error: error.message,
    });
  }
};

// ✅ IMPLEMENTED: Create Pet with Google Cloud Storage
const createPet = async (req, res) => {
  try {
    const petData = req.body;

    // Validate required fields
    const requiredFields = [
      "name",
      "type",
      "breed",
      "age",
      "price",
      "description",
    ];
    for (const field of requiredFields) {
      if (!petData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Add user who created the pet
    if (req.user) {
      petData.createdBy = req.user.id;
    }

    // Handle image upload if provided
    if (req.file) {
      try {
        const imageResult = await cloudStorage.uploadImage(
          req.file.buffer,
          req.file.originalname,
          "pets",
          null // petId will be added after creation
        );

        // Add cloud image data to pet
        petData.cloudImages = [
          {
            fileName: imageResult.fileName,
            originalName: imageResult.originalName,
            publicUrl: imageResult.publicUrl,
            gsUrl: imageResult.gsUrl,
            bucketName: imageResult.bucketName,
            size: imageResult.size,
            contentType: imageResult.contentType,
            isMain: true,
            folder: "pets",
          },
        ];

        // Set the main image URL for backwards compatibility
        petData.image = imageResult.publicUrl;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image",
          error: uploadError.message,
        });
      }
    }

    const pet = new Pet(petData);
    await pet.save();

    // Update cloud image with petId
    if (req.file && petData.cloudImages && petData.cloudImages.length > 0) {
      await Pet.findByIdAndUpdate(pet._id, {
        $set: {
          "cloudImages.0.metadata.petId": pet._id.toString(),
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Pet created successfully",
      data: pet,
    });
  } catch (error) {
    console.error("Create pet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pet",
      error: error.message,
    });
  }
};

// ✅ IMPLEMENTED: Update Pet with Google Cloud Storage
const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
      });
    }

    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Check if user has permission to update (owner or admin)
    if (
      req.user &&
      pet.createdBy &&
      pet.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this pet",
      });
    }

    // Handle new image upload
    if (req.file) {
      try {
        const imageResult = await cloudStorage.uploadImage(
          req.file.buffer,
          req.file.originalname,
          "pets",
          pet._id.toString()
        );

        // Add new cloud image
        const newCloudImage = {
          fileName: imageResult.fileName,
          originalName: imageResult.originalName,
          publicUrl: imageResult.publicUrl,
          gsUrl: imageResult.gsUrl,
          bucketName: imageResult.bucketName,
          size: imageResult.size,
          contentType: imageResult.contentType,
          isMain: true,
          folder: "pets",
          metadata: {
            petId: pet._id.toString(),
          },
        };

        // Mark old images as not main
        if (pet.cloudImages && pet.cloudImages.length > 0) {
          pet.cloudImages.forEach((img) => (img.isMain = false));
        }

        // Add new image
        if (!pet.cloudImages) pet.cloudImages = [];
        pet.cloudImages.push(newCloudImage);
        updateData.image = imageResult.publicUrl;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload new image",
          error: uploadError.message,
        });
      }
    }

    // Update pet with new data
    Object.keys(updateData).forEach((key) => {
      if (key !== "cloudImages") {
        // Handle cloudImages separately
        pet[key] = updateData[key];
      }
    });

    await pet.save();

    res.json({
      success: true,
      message: "Pet updated successfully",
      data: pet,
    });
  } catch (error) {
    console.error("Update pet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pet",
      error: error.message,
    });
  }
};

// ✅ IMPLEMENTED: Delete Pet with Google Cloud Storage cleanup
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
      });
    }

    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Check if user has permission to delete (owner or admin)
    if (
      req.user &&
      pet.createdBy &&
      pet.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this pet",
      });
    }

    // Delete images from Google Cloud Storage
    if (pet.cloudImages && pet.cloudImages.length > 0) {
      const deletePromises = pet.cloudImages.map(async (image) => {
        try {
          await cloudStorage.deleteImage(image.fileName);
        } catch (error) {
          console.warn(
            `Failed to delete image ${image.fileName}:`,
            error.message
          );
        }
      });

      await Promise.allSettled(deletePromises);
    }

    // Delete pet from database
    await Pet.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Pet deleted successfully",
    });
  } catch (error) {
    console.error("Delete pet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pet",
      error: error.message,
    });
  }
};

// ✅ IMPLEMENTED: Vote Pet
const votePet = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
      });
    }

    if (!["up", "down"].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Vote type must be "up" or "down"',
      });
    }

    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Initialize votes if they don't exist
    if (!pet.votes) {
      pet.votes = { up: 0, down: 0 };
    }

    // Initialize userVotes if it doesn't exist
    if (!pet.userVotes) {
      pet.userVotes = [];
    }

    // Check if user has already voted
    const existingVoteIndex = pet.userVotes.findIndex(
      (vote) => vote.user.toString() === userId
    );

    if (existingVoteIndex !== -1) {
      const existingVote = pet.userVotes[existingVoteIndex];

      // If same vote type, remove vote (toggle off)
      if (existingVote.voteType === voteType) {
        pet.votes[voteType] = Math.max(0, pet.votes[voteType] - 1);
        pet.userVotes.splice(existingVoteIndex, 1);
      } else {
        // If different vote type, switch vote
        pet.votes[existingVote.voteType] = Math.max(
          0,
          pet.votes[existingVote.voteType] - 1
        );
        pet.votes[voteType] = (pet.votes[voteType] || 0) + 1;
        existingVote.voteType = voteType;
        existingVote.votedAt = new Date();
      }
    } else {
      // New vote
      pet.votes[voteType] = (pet.votes[voteType] || 0) + 1;
      pet.userVotes.push({
        user: userId,
        voteType,
        votedAt: new Date(),
      });
    }

    await pet.save();

    res.json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        votes: pet.votes,
        userVote:
          pet.userVotes.find((vote) => vote.user.toString() === userId)
            ?.voteType || null,
      },
    });
  } catch (error) {
    console.error("Vote pet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record vote",
      error: error.message,
    });
  }
};

const ratePet = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const petId = req.params.id;

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 500 characters",
      });
    }

    const [user, pet] = await Promise.all([
      User.findById(userId),
      Pet.findById(petId),
    ]);

    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const existingRatingIndex = pet.ratings.findIndex(
      (r) => r.user.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      pet.ratings[existingRatingIndex].rating = rating;
      pet.ratings[existingRatingIndex].comment = comment || "";
      pet.ratings[existingRatingIndex].updatedAt = new Date();
    } else {
      pet.ratings.push({
        user: userId,
        rating,
        comment: comment || "",
        createdAt: new Date(),
      });
    }

    await pet.save();

    const updatedPet = await Pet.findById(petId).populate(
      "ratings.user",
      "username"
    );

    res.json({
      success: true,
      message:
        existingRatingIndex !== -1
          ? "Rating updated successfully"
          : "Rating submitted successfully",
      data: {
        averageRating: updatedPet.averageRating,
        totalRatings: updatedPet.ratings.length,
        userRating: rating,
        ratings: updatedPet.ratings.slice(-5),
      },
    });
  } catch (error) {
    console.error("Error rating pet:", error);
    res.status(400).json({
      success: false,
      message: "Error submitting rating",
      error: error.message,
    });
  }
};

const bulkUpdatePets = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { petIds, updateData } = req.body;

    if (!Array.isArray(petIds) || petIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Pet IDs array is required" });
    }

    const result = await Pet.updateMany({ _id: { $in: petIds } }, updateData, {
      runValidators: true,
    });

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} pets`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error bulk updating pets:", error);
    res.status(400).json({
      success: false,
      message: "Error updating pets",
      error: error.message,
    });
  }
};

const getPetStats = async (req, res) => {
  try {
    const stats = await Pet.aggregate([
      {
        $group: {
          _id: null,
          totalPets: { $sum: 1 },
          availablePets: {
            $sum: { $cond: [{ $eq: ["$available", true] }, 1, 0] },
          },
          avgPrice: { $avg: "$price" },
          totalVotes: { $sum: { $add: ["$votes.up", "$votes.down"] } },
          avgRating: { $avg: "$averageRating" },
        },
      },
      {
        $addFields: {
          adoptedPets: { $subtract: ["$totalPets", "$availablePets"] },
        },
      },
    ]);

    const typeStats = await Pet.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: { overview: stats[0] || {}, byType: typeStats },
    });
  } catch (error) {
    console.error("Error fetching pet stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

const getFeaturedPets = async (req, res) => {
  try {
    const featuredPets = await Pet.find({ featured: true }).limit(10);
    res.json({ success: true, data: featuredPets });
  } catch (error) {
    console.error("Error fetching featured pets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured pets",
      error: error.message,
    });
  }
};

const getAllPets = async (req, res) => {
  try {
    const sortOption = req.query.sort;
    let sortCriteria = {};

    if (sortOption === "newest") {
      sortCriteria = { createdAt: -1 };
    } else if (sortOption === "oldest") {
      sortCriteria = { createdAt: 1 };
    } else if (sortOption === "priceHigh") {
      sortCriteria = { price: -1 };
    } else if (sortOption === "priceLow") {
      sortCriteria = { price: 1 };
    }

    const pets = await Pet.find().sort(sortCriteria);

    res.json({ success: true, data: pets });
  } catch (error) {
    console.error("Error fetching all pets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pets",
      error: error.message,
    });
  }
};

const getPetsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const pets = await Pet.find({ type: type.toLowerCase() });

    if (!pets.length) {
      return res
        .status(404)
        .json({ success: false, message: `No pets found for type: ${type}` });
    }

    res.json({ success: true, data: pets });
  } catch (error) {
    console.error(`Error fetching pets of type ${req.params.type}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ ADDITIONAL: Add image to existing pet
const addImageToPet = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Check permission
    if (
      req.user &&
      pet.createdBy &&
      pet.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add images to this pet",
      });
    }

    const imageResult = await cloudStorage.uploadImage(
      req.file.buffer,
      req.file.originalname,
      "pets",
      pet._id.toString()
    );

    const newCloudImage = {
      fileName: imageResult.fileName,
      originalName: imageResult.originalName,
      publicUrl: imageResult.publicUrl,
      gsUrl: imageResult.gsUrl,
      bucketName: imageResult.bucketName,
      size: imageResult.size,
      contentType: imageResult.contentType,
      isMain: false, // Additional images are not main by default
      folder: "pets",
      metadata: {
        petId: pet._id.toString(),
      },
    };

    if (!pet.cloudImages) pet.cloudImages = [];
    pet.cloudImages.push(newCloudImage);
    await pet.save();

    res.status(201).json({
      success: true,
      message: "Image added successfully",
      data: newCloudImage,
    });
  } catch (error) {
    console.error("Add image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add image",
      error: error.message,
    });
  }
};

// ✅ ADDITIONAL: Remove image from pet
const removeImageFromPet = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID format",
      });
    }

    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Check permission
    if (
      req.user &&
      pet.createdBy &&
      pet.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove images from this pet",
      });
    }

    const imageIndex = pet.cloudImages.findIndex(
      (img) => img._id.toString() === imageId
    );
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const imageToRemove = pet.cloudImages[imageIndex];

    // Delete from Google Cloud Storage
    try {
      await cloudStorage.deleteImage(imageToRemove.fileName);
    } catch (error) {
      console.warn("Failed to delete from cloud storage:", error.message);
    }

    // Remove from database
    pet.cloudImages.splice(imageIndex, 1);

    // If this was the main image, set another as main
    if (imageToRemove.isMain && pet.cloudImages.length > 0) {
      pet.cloudImages[0].isMain = true;
      pet.image = pet.cloudImages[0].publicUrl;
    } else if (pet.cloudImages.length === 0) {
      pet.image = null;
    }

    await pet.save();

    res.json({
      success: true,
      message: "Image removed successfully",
    });
  } catch (error) {
    console.error("Remove image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove image",
      error: error.message,
    });
  }
};

// ✅ ES6 Export - Default export with all functions
export default {
  getAllPets,
  getFeaturedPets,
  getPetsByType,
  getPetById,
  createPet, // ✅ Now fully implemented
  updatePet, // ✅ Now fully implemented
  deletePet, // ✅ Now fully implemented
  votePet, // ✅ Now fully implemented
  ratePet,
  bulkUpdatePets,
  getPetStats,
  addImageToPet, // ✅ New function for adding images
  removeImageFromPet, // ✅ New function for removing images
  votingRateLimit,
};
