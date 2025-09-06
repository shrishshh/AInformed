import mongoose from 'mongoose';

const newsCacheSchema = new mongoose.Schema({
  // Cache key (e.g., "news:ai:1" for AI news page 1)
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Cached data
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  
  // Source information
  sources: {
    gnews: { type: Number, default: 0 },
    rss: { type: Number, default: 0 },
    gdelt: { type: Number, default: 0 },
    hn: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  
  // Metadata
  isMockData: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  
  // TTL for automatic expiration (1 hour)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
newsCacheSchema.index({ cacheKey: 1, expiresAt: 1 });

// Method to check if cache is still valid
newsCacheSchema.methods.isValid = function() {
  return this.expiresAt > new Date();
};

// Method to extend cache validity
newsCacheSchema.methods.extendValidity = function(minutes = 60) {
  this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

// Static method to find valid cache by key
newsCacheSchema.statics.findValidCache = function(cacheKey) {
  return this.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to clean expired caches
newsCacheSchema.statics.cleanExpired = function() {
  return this.deleteMany({
    expiresAt: { $lte: new Date() }
  });
};

// Static method to get cache statistics
newsCacheSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCaches: { $sum: 1 },
        validCaches: {
          $sum: {
            $cond: [{ $gt: ['$expiresAt', new Date()] }, 1, 0]
          }
        },
        expiredCaches: {
          $sum: {
            $cond: [{ $lte: ['$expiresAt', new Date()] }, 1, 0]
          }
        }
      }
    }
  ]);
};

const NewsCache = mongoose.models.NewsCache || mongoose.model('NewsCache', newsCacheSchema);

export default NewsCache;

