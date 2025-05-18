
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  reliabilityScore?: number; // Now optional
  publishedDate?: string;
  imageUrl?: string | null; // Can be a URL string from NewsAPI or null
}

export interface SummarizedArticle extends NewsArticle {
  aiSummary: string;
}
