import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INewsCache extends Document {
  cacheKey: string;
  data: any;
  sources: {
    gnews: number;
    rss: number;
    gdelt: number;
    hn: number;
    tavily: number;
    alphavantage: number;
    remotive: number;
    total: number;
  };
  isMockData: boolean;
  timestamp: Date;
  expiresAt: Date;
  isValid(): boolean;
  extendValidity(minutes?: number): Promise<INewsCache>;
}

export interface INewsCacheModel extends Model<INewsCache> {
  findValidCache(cacheKey: string): Promise<INewsCache | null>;
  cleanExpired(): Promise<any>;
  getStats(): Promise<any>;
}

const newsCacheSchema = new Schema<INewsCache>({
  cacheKey: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  sources: {
    gnews: { type: Number, default: 0 },
    rss: { type: Number, default: 0 },
    gdelt: { type: Number, default: 0 },
    hn: { type: Number, default: 0 },
    tavily: { type: Number, default: 0 },
    alphavantage: { type: Number, default: 0 },
    remotive: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  isMockData: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 },
  },
}, { timestamps: true });

newsCacheSchema.index({ cacheKey: 1, expiresAt: 1 });

newsCacheSchema.methods.isValid = function() {
  return this.expiresAt > new Date();
};

newsCacheSchema.methods.extendValidity = function(minutes = 60) {
  this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

newsCacheSchema.statics.findValidCache = async function(cacheKey: string) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Find cache that is both not expired AND created within the last hour
  const cache = await this.findOne({
    cacheKey,
    expiresAt: { $gt: now },
    $or: [
      { timestamp: { $gte: oneHourAgo } },
      { createdAt: { $gte: oneHourAgo } }
    ]
  });
  
  // Double-check: even if it passes the query, verify the timestamp is actually recent
  if (cache) {
    const cacheTime = cache.timestamp || cache.createdAt;
    const cacheAge = now.getTime() - new Date(cacheTime).getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (cacheAge > oneHour) {
      // Cache is too old, delete it and return null
      await this.deleteOne({ cacheKey });
      return null;
    }
  }
  
  return cache;
};

newsCacheSchema.statics.cleanExpired = async function() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Delete caches that are either expired OR older than 1 hour based on timestamp
  // Be explicit about all the conditions
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lte: now } },
      { timestamp: { $lt: oneHourAgo } },
      { createdAt: { $lt: oneHourAgo } },
      // Also catch any cache without proper timestamp
      { timestamp: { $exists: false } },
      { createdAt: { $exists: false } }
    ]
  });
  
  console.log(`🧹 cleanExpired: Deleted ${result.deletedCount} expired cache entries`);
  return result;
};

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

const NewsCache =
  (mongoose.models.NewsCache as INewsCacheModel) ||
  mongoose.model<INewsCache, INewsCacheModel>('NewsCache', newsCacheSchema);

export default NewsCache;
