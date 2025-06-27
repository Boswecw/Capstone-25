// server/middleware/auth.js - Enhanced ES6 Version
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database with enhanced checks
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    // ✨ Enhanced security checks
    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if user account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to failed login attempts.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Admin authorization middleware (enhanced version of your adminAuth)
const adminAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated (auth middleware should run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // ✨ Additional admin security checks
    // Double-check admin status in database (security measure)
    const currentUser = await User.findById(req.user._id);
    if (!currentUser || currentUser.role !== 'admin' || !currentUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges revoked or account deactivated'
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

// ✨ NEW: Admin or Moderator middleware
const adminOrModerator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const allowedRoles = ['admin', 'moderator'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or moderator access required'
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    next();
  } catch (error) {
    console.error('Admin/Moderator authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

// ✨ NEW: Prevent self-modification middleware
const preventSelfModification = (req, res, next) => {
  const { userId } = req.params;
  
  if (userId === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot perform this operation on your own account'
    });
  }
  
  next();
};

// ✨ NEW: Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // No token provided, continue without user context
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive && !user.isLocked) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user context
    req.user = null;
    next();
  }
};

// ✨ NEW: Rate limiting middleware (for sensitive operations)
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 5) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?._id?.toString();
    const ip = req.ip || req.connection.remoteAddress;
    const key = userId || ip;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request history for this key
    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    requests.set(key, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(key, validRequests);

    next();
  };
};

// ✨ NEW: Resource ownership middleware
const checkResourceOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      const isOwner = resource.createdBy?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify your own resources.'
        });
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Resource ownership check failed'
      });
    }
  };
};

// ✨ ES6 EXPORTS - Replace your module.exports with this:
export { 
  auth, 
  adminAuth,
  adminOrModerator,
  preventSelfModification,
  optionalAuth,
  createRateLimiter,
  checkResourceOwnership
};

// For backward compatibility, also export as default
export default auth;