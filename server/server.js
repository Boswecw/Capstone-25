// server/server.js - ES6 Module Version (Updated & Fixed)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import routes
import petRoutes from './routes/pets.js';
import userRoutes from './routes/user.js';
import contactRoutes from './routes/contact.js';
import bucketRoutes from './routes/buckets.js';
import productRoutes from './routes/products.js'

// ES6 module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE CONFIGURATION =====

// Rate limiting - Apply before other middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API-specific rate limiter (more restrictive)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 API requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", 
        "http:",
        "https://via.placeholder.com",
        "https://picsum.photos",
        "https://storage.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'", 
        "https://storage.googleapis.com",
        process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
        process.env.NODE_ENV === 'development' ? 'ws://localhost:3000' : ''
      ].filter(Boolean),
    },
  },
}));

// General middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.CLIENT_URL,
          process.env.FRONTEND_URL,
          // Add your actual Render URL here when deployed
          'https://your-app-name.onrender.com'
        ].filter(Boolean)
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001'
        ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON payload' 
      });
      return;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Apply rate limiting
app.use(generalLimiter);

// ===== DATABASE CONNECTION =====

const connectDB = async () => {
  try {
    // Use production URI if available, otherwise development
    const mongoURI = process.env.MONGODB_URI || 
                     process.env.MONGODB_URI_PRODUCTION || 
                     'mongodb://localhost:27017/furbabies';

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(mongoURI, options);

    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Connection Host: ${mongoose.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    
    // In production, exit the process if DB connection fails
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // In development, continue running (for testing without DB)
    console.warn('⚠️ Running without database connection (development mode)');
  }
};

// Connect to database
connectDB();

// ===== API ROUTES =====

// Apply API rate limiting to all API routes
app.use('/api/', apiLimiter);

// Mount API routes
app.use('/api/pets', petRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/buckets', bucketRoutes);
app.use('/api/products', productRoutes);

// ===== UTILITY ENDPOINTS =====

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({ 
    success: true,
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusText[dbStatus] || 'Unknown',
      readyState: dbStatus,
      host: mongoose.connection.host || 'Not connected'
    },
    server: {
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage()
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'FurBabies Pet Store API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      pets: '/api/pets',
      users: '/api/users',
      contact: '/api/contact',
      buckets: '/api/buckets',
      health: '/api/health',
      product:'/api/products'
    },
    documentation: 'See README.md for complete API documentation',
    timestamp: new Date().toISOString()
  });
});

// API status endpoint for monitoring
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// ===== PRODUCTION STATIC FILE SERVING =====

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  
  // Check if build directory exists
  try {
    await import('fs');
    const fs = await import('fs');
    if (fs.existsSync(clientBuildPath)) {
      console.log('📁 Serving static files from:', clientBuildPath);
      
      // Serve static files from the React app build directory
      app.use(express.static(clientBuildPath, {
        maxAge: '1y', // Cache static assets for 1 year
        etag: true,
        lastModified: true
      }));
      
      // Handle React routing - return all non-API requests to React app
      app.get('*', (req, res) => {
        // Don't serve index.html for API routes
        if (req.url.startsWith('/api/')) {
          return res.status(404).json({
            success: false,
            message: 'API endpoint not found',
            endpoint: req.originalUrl
          });
        }
        
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
    } else {
      console.warn('⚠️ Client build directory not found:', clientBuildPath);
      console.warn('⚠️ Run "npm run build" to create the build directory');
    }
  } catch (error) {
    console.error('❌ Error setting up static file serving:', error);
  }
}

// ===== ERROR HANDLING =====

// Handle 404 for API routes specifically
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    
    return res.status(400).json({
      success: false,
      message: `${field} '${value}' already exists`,
      field: field
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired'
    });
  }
  
  // CORS error
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation - origin not allowed'
    });
  }
  
  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      field: error.path
    });
  }
  
  // Default error response
  const statusCode = error.status || error.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong on our end' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      error: error
    })
  });
});

// ===== GRACEFUL SHUTDOWN =====

const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal. Shutting down gracefully...');
  
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed.');
    console.log('👋 Server shutdown complete.');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// ===== START SERVER =====

const server = app.listen(PORT, () => {
  console.log('\n🚀 FurBabies Pet Store Server Started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 Frontend (if running): http://localhost:3000`);
    console.log(`🔗 Backend API: http://localhost:${PORT}/api`);
  }
  
  console.log('\n📋 Available Endpoints:');
  console.log('   GET  /api/health     - Server health check');
  console.log('   GET  /api           - API information');
  console.log('   GET  /api/pets      - Get all pets');
  console.log('   POST /api/users     - User registration');
  console.log('   POST /api/contact   - Contact form');
  console.log('\n✅ Server ready to accept connections\n');
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('💡 Try a different port or stop the conflicting process');
  } else {
    console.error('❌ Server startup error:', error);
  }
  process.exit(1);
});

export default app;