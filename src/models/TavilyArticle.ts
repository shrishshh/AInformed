import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITavilyArticle extends Document {
  url: string;
  title: string;
  description?: string;
  source?: string;
  publishedAt: Date;
  group: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITavilyArticleModel extends Model<ITavilyArticle> {}

const tavilyArticleSchema = new Schema<ITavilyArticle>(
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

// Optional TTL: auto-expire Tavily articles after 7 days
tavilyArticleSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

const TavilyArticle =
  (mongoose.models.TavilyArticle as ITavilyArticleModel) ||
  mongoose.model<ITavilyArticle, ITavilyArticleModel>(
    'TavilyArticle',
    tavilyArticleSchema
  );

export default TavilyArticle;

