// server/controllers/userController.js - ES6 Version
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';

// Register a new user
const registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create new user
    const userData = { username, email, password };
    
    // Only allow admin to set roles other than 'user'
    if (role && req.user && req.user.role === 'admin') {
      userData.role = role;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Update user stats
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    // Validate required fields
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update login info
    await user.updateLastLogin();

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favoritePets', 'name type breed image imageUrl')
      .populate('adoptedPets.pet', 'name type breed')
      .select('-password -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Include additional computed fields
    const profile = {
      ...user.toJSON(),
      accountStatus: user.accountStatus,
      totalFavorites: user.favoritePets.length,
      totalAdoptions: user.adoptedPets.length
    };

    res.json({
      success: true,
      user: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.role;
    delete updates.isActive;
    delete updates.isVerified;
    delete updates.loginAttempts;
    delete updates.lockUntil;

    // Update profile fields
    if (updates.profile) {
      await user.updateProfile(updates.profile);
      delete updates.profile;
    }

    // Update preferences
    if (updates.preferences) {
      await user.updatePreferences(updates.preferences);
      delete updates.preferences;
    }

    // Update other allowed fields
    const allowedFields = ['username', 'email'];
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        user[key] = updates[key];
      }
    });

    await user.save();

    // Return updated user (without sensitive data)
    const updatedUser = await User.findById(user._id)
      .populate('favoritePets', 'name type breed image')
      .select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required'
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one letter and one number'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Delete user account
const deleteUserAccount = async (req, res) => {
  try {
    const { password, confirmDeletion } = req.body;

    // Validate required fields
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    if (confirmDeletion !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please type "DELETE" to confirm account deletion'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Instead of hard delete, deactivate account (soft delete)
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.username = `deleted_${Date.now()}_${user.username}`;
    await user.save();

    // Or for hard delete, uncomment the line below:
    // await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
};

// ✨ ES6 EXPORT - Replace your module.exports with this:
export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount
};