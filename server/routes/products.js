// server/routes/products.js - Quick fix for /api/products/featured calls
import express from 'express';

const router = express.Router();

// Mock featured products (same as pets for now)
const featuredProducts = [
  {
    _id: '1',
    name: 'Buddy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    description: 'Friendly and energetic dog looking for a loving home.',
    image: 'https://via.placeholder.com/400x300?text=Buddy+the+Dog',
    featured: true,
    price: 500
  },
  {
    _id: '2', 
    name: 'Whiskers',
    type: 'cat',
    breed: 'Persian',
    age: 2,
    description: 'Calm and affectionate cat perfect for apartment living.',
    image: 'https://via.placeholder.com/400x300?text=Whiskers+the+Cat',
    featured: true,
    price: 300
  },
  {
    _id: '3',
    name: 'Nemo',
    type: 'aquatic',
    breed: 'Goldfish',
    age: 1,
    description: 'Beautiful goldfish perfect for beginners.',
    image: 'https://via.placeholder.com/400x300?text=Nemo+the+Fish',
    featured: true,
    price: 25
  }
];

// Get featured products
router.get('/featured', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const products = featuredProducts.slice(0, limit);
    
    console.log(`⭐ Returning ${products.length} featured products`);
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('❌ Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});

// Get all products
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      count: featuredProducts.length,
      data: featuredProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

export default router;