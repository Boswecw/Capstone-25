import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    validate: {
      validator: function(password) {
        // Password must contain at least one letter and one number
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/.test(password);
      },
      message: 'Password must contain at least one letter and one number'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    avatar: {
      type: String,
      default: '/images/default-avatar.png'
    }
  },
  preferences: {
    petTypes: [String],
    newsletter: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Pet-related fields
  favoritePets: [{
    type: Schema.Types.ObjectId,
    ref: 'Pet'
  }],
  votedPets: [{
    pet: { type: Schema.Types.ObjectId, ref: 'Pet' },
    voteType: { type: String, enum: ['up', 'down'] },
    votedAt: { type: Date, default: Date.now }
  }],
  adoptedPets: [{
    pet: { type: Schema.Types.ObjectId, ref: 'Pet' },
    adoptedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed'],
      default: 'pending'
    }
  }],
  
  // Activity tracking
  stats: {
    petsViewed: { type: Number, default: 0 },
    petsFavorited: { type: Number, default: 0 },
    ratingsGiven: { type: Number, default: 0 },
    commentsPosted: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// ✨ VIRTUAL PROPERTIES ✨

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Virtual for account status
userSchema.virtual('accountStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.lockUntil && this.lockUntil > Date.now()) return 'locked';
  if (!this.isVerified) return 'unverified';
  return 'active';
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ✨ MIDDLEWARE ✨

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update stats before saving
userSchema.pre('save', function(next) {
  if (this.isModified('favoritePets')) {
    this.stats.petsFavorited = this.favoritePets.length;
  }
  next();
});

// ✨ INSTANCE METHODS ✨

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Add pet to favorites
userSchema.methods.addToFavorites = function(petId) {
  if (!this.favoritePets.includes(petId)) {
    this.favoritePets.push(petId);
    this.stats.petsFavorited += 1;
  }
  return this.save();
};

// Remove pet from favorites
userSchema.methods.removeFromFavorites = function(petId) {
  this.favoritePets = this.favoritePets.filter(id => id.toString() !== petId.toString());
  this.stats.petsFavorited = Math.max(0, this.stats.petsFavorited - 1);
  return this.save();
};

// Vote on pet
userSchema.methods.votePet = function(petId, voteType) {
  // Remove existing vote for this pet
  this.votedPets = this.votedPets.filter(vote => vote.pet.toString() !== petId.toString());
  
  // Add new vote
  this.votedPets.push({
    pet: petId,
    voteType: voteType,
    votedAt: new Date()
  });
  
  return this.save();
};

// Get user's vote for a specific pet
userSchema.methods.getVoteForPet = function(petId) {
  const vote = this.votedPets.find(vote => vote.pet.toString() === petId.toString());
  return vote ? vote.voteType : null;
};

// Increment stats
userSchema.methods.incrementStat = function(statName) {
  if (this.stats[statName] !== undefined) {
    this.stats[statName] += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Update profile
userSchema.methods.updateProfile = function(profileData) {
  Object.keys(profileData).forEach(key => {
    if (this.profile[key] !== undefined) {
      this.profile[key] = profileData[key];
    }
  });
  return this.save();
};

// Update preferences
userSchema.methods.updatePreferences = function(preferences) {
  Object.keys(preferences).forEach(key => {
    if (this.preferences[key] !== undefined) {
      this.preferences[key] = preferences[key];
    }
  });
  return this.save();
};

// ✨ STATIC METHODS ✨

// Find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role: role, isActive: true });
};

// Get user statistics
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
        adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0
  };
};

// ✨ INDEXES ✨
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'favoritePets': 1 });
userSchema.index({ createdAt: -1 });

export default model('User', userSchema);