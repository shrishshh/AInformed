import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPerplexityArticle extends Document {
  url: string;
  title: string;
  description?: string;
  source?: string;
  publishedAt: Date;
  group: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPerplexityArticleModel extends Model<IPerplexityArticle> {}

const perplexityArticleSchema = new Schema<IPerplexityArticle>(
  {
    url: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    source: { type: String },
    publishedAt: { type: Date, index: true },
    group: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

// Optional TTL: auto-expire Perplexity articles after 7 days
perplexityArticleSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

const PerplexityArticle =
  (mongoose.models.PerplexityArticle as IPerplexityArticleModel) ||
  mongoose.model<IPerplexityArticle, IPerplexityArticleModel>(
    'PerplexityArticle',
    perplexityArticleSchema
  );

export default PerplexityArticle;

