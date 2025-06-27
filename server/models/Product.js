// server/models/Product.js - Fixed version with correct enums
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: [
        "food",
        "toys", 
        "beds",
        "accessories",
        "health",
        "grooming",
        "training",
        "housing",  // Added for aquarium kits
        "supplies"  // Added for general supplies
      ],
      lowercase: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    image: {
      type: String,
      required: [true, "Product image is required"],
    },
    images: [
      {
        type: String,
      },
    ],
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, "Stock quantity cannot be negative"],
    },
    petTypes: [
      {
        type: String,
        enum: ["dog", "cat", "fish", "bird", "small-pet", "reptile", "all"],
        lowercase: true,
      },
    ],
    size: {
      type: String,
      enum: [
        "xs", 
        "small", 
        "medium", 
        "large", 
        "xl", 
        "one-size",
        "variety-pack",    // For toy sets
        "large-bag",       // For food
        "10-gallon",       // For aquarium kits
        "starter-pack"     // For starter kits
      ],
      lowercase: true,
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ["oz", "lb", "g", "kg"],
        default: "lb",
      },
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    votes: {
      up: {
        type: Number,
        default: 0,
      },
      down: {
        type: Number,
        default: 0,
      },
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    salePrice: {
      type: Number,
      min: [0, "Sale price cannot be negative"],
    },
    saleEndDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Made optional for seeding
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for average rating
productSchema.virtual("averageRating").get(function () {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return (sum / this.ratings.length).toFixed(1);
});

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (!this.originalPrice || !this.salePrice) return 0;
  return Math.round(
    ((this.originalPrice - this.salePrice) / this.originalPrice) * 100,
  );
});

// Index for search functionality
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  tags: "text",
});

productSchema.index({ category: 1, petTypes: 1, inStock: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);