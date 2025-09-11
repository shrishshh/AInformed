import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INewsCache extends Document {
  cacheKey: string;
  data: any;
  sources: {
    gnews: number;
    rss: number;
    gdelt: number;
    hn: number;
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

newsCacheSchema.statics.findValidCache = function(cacheKey: string) {
  return this.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() }
  });
};

newsCacheSchema.statics.cleanExpired = function() {
  return this.deleteMany({
    expiresAt: { $lte: new Date() }
  });
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
