// server/controllers/productController.js - ES6 Module Version
import Product from "../models/Product.js";
import User from "../models/User.js";

// Sample data for fallback (if no database)
const sampleProducts = [
  {
    _id: "1",
    name: "Premium Dog Food",
    category: "food",
    brand: "NutriPup",
    price: 29.99,
    originalPrice: 34.99,
    image: "/images/dog-food.jpg",
    description: "High-quality nutrition for dogs of all sizes.",
    inStock: true,
    stockQuantity: 50,
    petTypes: ["dog"],
    size: "large",
    featured: true,
    ratings: [],
    votes: { up: 15, down: 2 },
    averageRating: 4.8,
    createdAt: new Date(),
  },
  {
    _id: "2",
    name: "Interactive Cat Toy",
    category: "toys",
    brand: "PlayCat",
    price: 15.99,
    image: "/images/cat-toy.jpg",
    description:
      "Keep your cat entertained for hours with this interactive toy.",
    inStock: true,
    stockQuantity: 25,
    petTypes: ["cat"],
    size: "medium",
    featured: true,
    ratings: [],
    votes: { up: 12, down: 1 },
    averageRating: 4.5,
    createdAt: new Date(),
  },
  {
    _id: "3",
    name: "Comfortable Pet Bed",
    category: "beds",
    brand: "CozyPaws",
    price: 45.99,
    image: "/images/pet-bed.jpg",
    description: "Soft and comfortable sleeping solution for pets.",
    inStock: true,
    stockQuantity: 15,
    petTypes: ["dog", "cat"],
    size: "large",
    featured: true,
    ratings: [],
    votes: { up: 20, down: 0 },
    averageRating: 4.9,
    createdAt: new Date(),
  },
  {
    _id: "4",
    name: "Aquarium Starter Kit",
    category: "accessories",
    brand: "AquaLife",
    price: 89.99,
    image: "/images/aquarium-kit.jpg",
    description: "Complete setup for your aquatic pets.",
    inStock: true,
    stockQuantity: 8,
    petTypes: ["fish"],
    size: "large",
    featured: false,
    ratings: [],
    votes: { up: 8, down: 1 },
    averageRating: 4.3,
    createdAt: new Date(),
  },
];

// Get all products with filtering and pagination
const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      petType,
      minPrice,
      maxPrice,
      inStock,
      featured,
      brand,
      size,
      sort = "newest",
      search,
      page = 1,
      limit = 12,
    } = req.query;

    let products;

    try {
      // Try to fetch from database first
      let filter = {};

      if (category && category !== "all") filter.category = category;
      if (petType && petType !== "all") filter.petTypes = { $in: [petType] };
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      if (inStock === "true") filter.inStock = true;
      if (featured === "true") filter.featured = true;
      if (brand && brand !== "all") filter.brand = brand;
      if (size && size !== "all") filter.size = size;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
        ];
      }

      const sortOption = {};
      switch (sort) {
        case "price-low":
          sortOption.price = 1;
          break;
        case "price-high":
          sortOption.price = -1;
          break;
        case "popular":
          sortOption["votes.up"] = -1;
          break;
        case "rating":
          sortOption.averageRating = -1;
          break;
        case "alphabetical":
          sortOption.name = 1;
          break;
        default:
          sortOption.createdAt = -1;
      }

      products = await Product.find(filter)
        .sort(sortOption)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate("createdBy", "username");

      const total = await Product.countDocuments(filter);

      res.json({
        success: true,
        count: products.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        data: products,
      });
    } catch (dbError) {
      // Fallback to sample data if database fails
      console.log("Database not available, using sample data");

      let filteredProducts = [...sampleProducts];

      // Apply filters to sample data
      if (category && category !== "all") {
        filteredProducts = filteredProducts.filter(
          (p) => p.category === category,
        );
      }
      if (petType && petType !== "all") {
        filteredProducts = filteredProducts.filter((p) =>
          p.petTypes.includes(petType),
        );
      }
      if (minPrice) {
        filteredProducts = filteredProducts.filter(
          (p) => p.price >= parseFloat(minPrice),
        );
      }
      if (maxPrice) {
        filteredProducts = filteredProducts.filter(
          (p) => p.price <= parseFloat(maxPrice),
        );
      }
      if (featured === "true") {
        filteredProducts = filteredProducts.filter((p) => p.featured);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.brand.toLowerCase().includes(searchLower),
        );
      }

      // Apply sorting
      if (sort === "price-low") {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sort === "price-high") {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else if (sort === "popular") {
        filteredProducts.sort(
          (a, b) => (b.votes?.up || 0) - (a.votes?.up || 0),
        );
      } else if (sort === "rating") {
        filteredProducts.sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedProducts = filteredProducts.slice(
        startIndex,
        startIndex + parseInt(limit),
      );

      res.json({
        success: true,
        count: paginatedProducts.length,
        total: filteredProducts.length,
        pages: Math.ceil(filteredProducts.length / limit),
        currentPage: parseInt(page),
        data: paginatedProducts,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    try {
      // Try database first
      const featured = await Product.find({ featured: true, inStock: true })
        .sort({ "votes.up": -1, createdAt: -1 })
        .limit(parseInt(limit));

      res.json({ success: true, data: featured });
    } catch (dbError) {
      // Fallback to sample data
      const featured = sampleProducts
        .filter((p) => p.featured)
        .slice(0, parseInt(limit));

      res.json({ success: true, data: featured });
    }
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured products",
      error: error.message,
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, sort = "newest" } = req.query;

    const validCategories = [
      "food",
      "toys",
      "beds",
      "accessories",
      "health",
      "grooming",
      "training",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product category",
      });
    }

    try {
      // Try database first
      const filter = { category, inStock: true };
      const sortOption = {};

      switch (sort) {
        case "price-low":
          sortOption.price = 1;
          break;
        case "price-high":
          sortOption.price = -1;
          break;
        case "popular":
          sortOption["votes.up"] = -1;
          break;
        default:
          sortOption.createdAt = -1;
      }

      const products = await Product.find(filter)
        .sort(sortOption)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Product.countDocuments(filter);

      res.json({
        success: true,
        count: products.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        data: products,
      });
    } catch (dbError) {
      // Fallback to sample data
      const filtered = sampleProducts.filter((p) => p.category === category);

      res.json({
        success: true,
        count: filtered.length,
        total: filtered.length,
        pages: 1,
        currentPage: 1,
        data: filtered,
      });
    }
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products by category",
      error: error.message,
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      // Try database first
      const product = await Product.findById(id)
        .populate("createdBy", "username email")
        .populate("ratings.user", "username");

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.json({ success: true, data: product });
    } catch (dbError) {
      // Fallback to sample data
      const product = sampleProducts.find((p) => p._id === id);

      if (product) {
        res.json({ success: true, data: product });
      } else {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Create new product (admin/authenticated users only)
const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    const populatedProduct = await Product.findById(savedProduct._id).populate(
      "createdBy",
      "username",
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update product (admin/owner only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "username");

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete product (admin/owner only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      data: { deletedProductId: id },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Vote on product (authenticated users only)
const voteProduct = async (req, res) => {
  try {
    res.json({
      success: true,
      message:
        "Product voting will be implemented with full database integration",
      data: { votes: { up: 10, down: 1 } },
    });
  } catch (error) {
    console.error("Error voting on product:", error);
    res.status(500).json({
      success: false,
      message: "Error voting on product",
      error: error.message,
    });
  }
};

// Rate product (authenticated users only)
const rateProduct = async (req, res) => {
  try {
    res.json({
      success: true,
      message:
        "Product rating will be implemented with full database integration",
      data: { averageRating: 4.5, totalRatings: 10 },
    });
  } catch (error) {
    console.error("Error rating product:", error);
    res.status(400).json({
      success: false,
      message: "Error rating product",
      error: error.message,
    });
  }
};

// ✅ ES6 Export - Default export with all functions
export default {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  voteProduct,
  rateProduct,
};