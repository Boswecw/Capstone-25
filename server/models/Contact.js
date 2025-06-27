// server/models/Contact.js - ES6 Module Version
import { Schema, model } from 'mongoose';

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    subject: {
      type: String,
      default: "General Inquiry",
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    category: {
      type: String,
      enum: ['general', 'adoption', 'support', 'complaint', 'suggestion', 'partnership'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ["new", "read", "responded", "resolved", "closed"],
      default: "new",
      index: true
    },
    response: {
      message: {
        type: String,
        trim: true
      },
      respondedBy: { 
        type: Schema.Types.ObjectId, 
        ref: "User" 
      },
      respondedAt: {
        type: Date
      }
    },
    relatedPet: {
      type: Schema.Types.ObjectId,
      ref: 'Pet'
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    followUpRequired: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    notes: [{
      text: String,
      addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ✨ VIRTUAL PROPERTIES ✨

// Virtual for response status
contactSchema.virtual('hasResponse').get(function() {
  return !!(this.response && this.response.message);
});

// Virtual for days since creation
contactSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (24 * 60 * 60 * 1000));
});

// Virtual for urgency level
contactSchema.virtual('urgencyLevel').get(function() {
  const daysSince = this.daysSinceCreated;
  const priority = this.priority;
  
  if (priority === 'urgent' || daysSince > 7) return 'high';
  if (priority === 'high' || daysSince > 3) return 'medium';
  return 'low';
});

// ✨ MIDDLEWARE ✨

// Pre-save middleware to auto-assign tags
contactSchema.pre('save', function(next) {
  // Auto-assign tags based on content
  const autoTags = [];
  
  if (this.category) autoTags.push(this.category);
  if (this.priority) autoTags.push(this.priority);
  if (this.relatedPet) autoTags.push('pet-inquiry');
  
  // Add keyword-based tags
  const messageText = this.message.toLowerCase();
  if (messageText.includes('adoption')) autoTags.push('adoption');
  if (messageText.includes('urgent') || messageText.includes('emergency')) autoTags.push('urgent');
  if (messageText.includes('complaint')) autoTags.push('complaint');
  if (messageText.includes('feedback')) autoTags.push('feedback');
  
  // Merge with existing tags (avoid duplicates)
  this.tags = [...new Set([...this.tags, ...autoTags])];
  
  next();
});

// ✨ STATIC METHODS ✨

// Find contacts by status
contactSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Find unread contacts
contactSchema.statics.findUnread = function() {
  return this.find({ status: 'new' }).sort({ createdAt: -1 });
};

// Find urgent contacts
contactSchema.statics.findUrgent = function() {
  return this.find({
    $or: [
      { priority: 'urgent' },
      { createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  }).sort({ createdAt: 1 });
};

// Get contact statistics
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        responded: { $sum: { $cond: [{ $eq: ['$status', 'responded'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    new: 0,
    responded: 0,
    resolved: 0,
    urgent: 0
  };
};

// ✨ INSTANCE METHODS ✨

// Mark as read
contactSchema.methods.markAsRead = function() {
  if (this.status === 'new') {
    this.status = 'read';
  }
  return this.save();
};

// Add response
contactSchema.methods.addResponse = function(responseMessage, userId) {
  this.response = {
    message: responseMessage,
    respondedBy: userId,
    respondedAt: new Date()
  };
  this.status = 'responded';
  return this.save();
};

// Add note
contactSchema.methods.addNote = function(noteText, userId) {
  this.notes.push({
    text: noteText,
    addedBy: userId,
    addedAt: new Date()
  });
  return this.save();
};

// Close contact
contactSchema.methods.closeContact = function() {
  this.status = 'closed';
  return this.save();
};

// ✨ INDEXES ✨
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ category: 1, priority: 1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ 'response.respondedBy': 1 });

export default model('Contact', contactSchema);