import { Schema, model } from 'mongoose';

// Cloud Storage Image Schema
const cloudImageSchema = new Schema({
  fileName: { type: String, required: true },
  originalName: String,
  publicUrl: { type: String, required: true },
  thumbnailUrl: String,
  gsUrl: String, // Google Storage URL (gs://bucket/file)
  bucketName: String,
  size: Number,
  contentType: String,
  uploadDate: { type: Date, default: Date.now },
  folder: String, // pets, products, etc.
  isMain: { type: Boolean, default: false },
  tags: [String],
  description: String,
  metadata: {
    width: Number,
    height: Number,
    processed: { type: Boolean, default: false }
  }
});

// User Vote Schema - ADD THIS TO YOUR MODEL
const userVoteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  voteType: {
    type: String,
    enum: ["up", "down"],
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

const petSchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Pet type is required'],
    enum: ["dog", "cat", "fish", "bird", "small-pet", "supply"],
    lowercase: true,
    index: true
  },
  breed: {
    type: String,
    required: [true, 'Breed is required'],
    trim: true,
    maxlength: [50, 'Breed cannot exceed 50 characters']
  },
  age: {
    type: String,
    required: [true, 'Age is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Status Fields
  available: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },

  // User Interaction
  votes: {
    up: { type: Number, default: 0, min: 0 },
    down: { type: Number, default: 0, min: 0 }
  },
  userVotes: [userVoteSchema], // ADD THIS LINE TO YOUR MODEL
  ratings: [{
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true
    },
    rating: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5'],
      required: true
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: { type: Date, default: Date.now }
  }],

  // Physical Characteristics
  size: {
    type: String,
    enum: ["small", "medium", "large", "extra-large"],
    lowercase: true,
    required: function () {
      return this.type !== "supply";
    }
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    lowercase: true,
    required: function () {
      return ["dog", "cat", "bird", "small-pet"].includes(this.type);
    }
  },
  characteristics: [{
    type: String,
    trim: true,
    maxlength: [30, 'Characteristic cannot exceed 30 characters']
  }],

  // Health Information
  healthInfo: {
    vaccinated: { type: Boolean, default: false },
    spayed: { type: Boolean, default: false },
    microchipped: { type: Boolean, default: false },
    specialNeeds: { 
      type: String, 
      trim: true,
      maxlength: [200, 'Special needs description too long']
    }
  },

  // Location Information
  location: {
    shelter: { 
      type: String, 
      default: 'FurBabies Main Location',
      trim: true
    },
    city: { type: String, default: 'Louisville', trim: true },
    state: { type: String, default: 'KY', trim: true }
  },

  // Adoption Information
  adoptionStatus: {
    type: String,
    enum: ["available", "pending", "adopted", "hold"],
    default: "available",
    index: true
  },

  // Administrative Fields
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  views: { type: Number, default: 0, min: 0 },
  favoriteCount: { type: Number, default: 0, min: 0 },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Supply-specific fields
  inStock: {
    type: Boolean,
    default: true,
    required: function() {
      return this.type === "supply";
    }
  },
  stockQuantity: {
    type: Number,
    min: [0, 'Stock quantity cannot be negative'],
    default: function() {
      return this.type === "supply" ? 1 : undefined;
    }
  },

  // ✨ CLOUD STORAGE FIELDS ✨
  cloudImages: [cloudImageSchema],
  mainCloudImageId: String,
  imageGallery: {
    profile: [cloudImageSchema],
    action: [cloudImageSchema],
    medical: [cloudImageSchema]
  },
  
  // Legacy image field for backward compatibility
  image: {
    type: String,
    default: '/images/default-pet.jpg'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✨ VIRTUAL PROPERTIES ✨

// Virtual for main image URL
petSchema.virtual('imageUrl').get(function() {
  if (this.mainCloudImageId) {
    const mainImage = this.cloudImages.find(img => img._id.toString() === this.mainCloudImageId);
    return mainImage ? mainImage.publicUrl : this.image;
  }
  return this.cloudImages.length > 0 ? this.cloudImages[0].publicUrl : this.image;
});

// Virtual for thumbnail URL
petSchema.virtual('thumbnailUrl').get(function() {
  if (this.mainCloudImageId) {
    const mainImage = this.cloudImages.find(img => img._id.toString() === this.mainCloudImageId);
    return mainImage ? (mainImage.thumbnailUrl || mainImage.publicUrl) : this.image;
  }
  return this.cloudImages.length > 0 ? 
    (this.cloudImages[0].thumbnailUrl || this.cloudImages[0].publicUrl) : this.image;
});

// Virtual for average rating
petSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const total = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return (total / this.ratings.length).toFixed(1);
});

// Virtual for popularity score
petSchema.virtual('popularityScore').get(function() {
  const voteScore = this.votes.up - this.votes.down;
  const ratingScore = this.averageRating * this.ratings.length;
  return voteScore + ratingScore;
});

// Virtual for full image count
petSchema.virtual('totalImages').get(function() {
  return this.cloudImages.length;
});

// ✨ MIDDLEWARE ✨

// Pre-save middleware
petSchema.pre('save', function(next) {
  // Update tags based on other fields
  if (this.isModified('type') || this.isModified('size') || this.isModified('age')) {
    const autoTags = [];
    
    if (this.type) autoTags.push(this.type);
    if (this.size) autoTags.push(this.size);
    if (this.age.includes('puppy') || this.age.includes('kitten')) autoTags.push('young');
    if (this.age.includes('senior')) autoTags.push('senior');
    if (this.healthInfo.vaccinated) autoTags.push('vaccinated');
    if (this.healthInfo.spayed) autoTags.push('spayed');
    
    // Merge with existing tags (avoid duplicates)
    this.tags = [...new Set([...this.tags, ...autoTags])];
  }
  
  // Update availability based on adoption status
  if (this.adoptionStatus === 'adopted') {
    this.available = false;
  }
  
  next();
});

// ✨ STATIC METHODS ✨

petSchema.statics.findAvailable = function() {
  return this.find({ available: true, adoptionStatus: 'available' });
};

petSchema.statics.findFeatured = function() {
  return this.find({ featured: true, available: true });
};

petSchema.statics.findByType = function(type) {
  return this.find({ type: type, available: true });
};

petSchema.statics.findPopular = function() {
  return this.find({ available: true })
    .sort({ views: -1, 'votes.up': -1 })
    .limit(10);
};

petSchema.statics.findWithImages = function() {
  return this.find({ 
    $or: [
      { 'cloudImages.0': { $exists: true } },
      { image: { $ne: '/images/default-pet.jpg' } }
    ]
  });
};

// ✨ INSTANCE METHODS ✨

petSchema.methods.incrementViews = function() {
  this.views = (this.views || 0) + 1;
  return this.save();
};

petSchema.methods.addToFavorites = function() {
  this.favoriteCount = (this.favoriteCount || 0) + 1;
  return this.save();
};

petSchema.methods.removeFromFavorites = function() {
  this.favoriteCount = Math.max(0, (this.favoriteCount || 0) - 1);
  return this.save();
};

petSchema.methods.addCloudImage = function(imageData, category = 'profile') {
  // Add to main images array
  this.cloudImages.push(imageData);
  
  // Add to appropriate gallery
  if (!this.imageGallery[category]) {
    this.imageGallery[category] = [];
  }
  this.imageGallery[category].push(imageData);
  
  // Set as main image if it's the first one
  if (!this.mainCloudImageId) {
    this.mainCloudImageId = imageData._id;
    imageData.isMain = true;
  }
  
  return this.save();
};

petSchema.methods.removeCloudImage = function(imageId) {
  // Remove from main images
  this.cloudImages = this.cloudImages.filter(img => img._id.toString() !== imageId);
  
  // Remove from galleries
  Object.keys(this.imageGallery).forEach(category => {
    this.imageGallery[category] = this.imageGallery[category].filter(
      img => img._id.toString() !== imageId
    );
  });
  
  // Update main image if needed
  if (this.mainCloudImageId === imageId) {
    this.mainCloudImageId = this.cloudImages.length > 0 ? this.cloudImages[0]._id : null;
    if (this.cloudImages.length > 0) {
      this.cloudImages[0].isMain = true;
    }
  }
  
  return this.save();
};

petSchema.methods.setMainImage = function(imageId) {
  // Update all images
  this.cloudImages.forEach(img => {
    img.isMain = img._id.toString() === imageId;
  });
  
  // Update galleries
  Object.keys(this.imageGallery).forEach(category => {
    this.imageGallery[category].forEach(img => {
      img.isMain = img._id.toString() === imageId;
    });
  });
  
  this.mainCloudImageId = imageId;
  return this.save();
};

// ADD THESE NEW METHODS FOR VOTING SYSTEM
petSchema.methods.addVote = function(userId, voteType) {
  // Initialize userVotes if it doesn't exist
  if (!this.userVotes) {
    this.userVotes = [];
  }
  
  // Initialize votes if they don't exist
  if (!this.votes) {
    this.votes = { up: 0, down: 0 };
  }

  // Check if user has already voted
  const existingVoteIndex = this.userVotes.findIndex(
    vote => vote.user.toString() === userId
  );

  if (existingVoteIndex !== -1) {
    const existingVote = this.userVotes[existingVoteIndex];
    
    // If same vote type, remove vote (toggle off)
    if (existingVote.voteType === voteType) {
      this.votes[voteType] = Math.max(0, this.votes[voteType] - 1);
      this.userVotes.splice(existingVoteIndex, 1);
      return 'removed';
    } else {
      // If different vote type, switch vote
      this.votes[existingVote.voteType] = Math.max(0, this.votes[existingVote.voteType] - 1);
      this.votes[voteType] = (this.votes[voteType] || 0) + 1;
      existingVote.voteType = voteType;
      existingVote.votedAt = new Date();
      return 'changed';
    }
  } else {
    // New vote
    this.votes[voteType] = (this.votes[voteType] || 0) + 1;
    this.userVotes.push({
      user: userId,
      voteType,
      votedAt: new Date()
    });
    return 'added';
  }
};

petSchema.methods.getUserVote = function(userId) {
  if (!this.userVotes) return null;
  const userVote = this.userVotes.find(vote => vote.user.toString() === userId);
  return userVote ? userVote.voteType : null;
};

// ✨ INDEXES ✨
petSchema.index({ type: 1, available: 1 });
petSchema.index({ adoptionStatus: 1, available: 1 });
petSchema.index({ featured: 1, available: 1 });
petSchema.index({ 'votes.up': -1, views: -1 });
petSchema.index({ tags: 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ 'userVotes.user': 1 }); // ADD THIS INDEX

export default model('Pet', petSchema);