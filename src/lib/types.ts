
export interface NewsArticle {
  id: string; // This will be typically the URL or a generated ID
  title: string;
  summary: string;
  source: string;
  url: string;
  reliabilityScore?: number | null; // Optional, as NewsAPI won't provide this
  publishedDate?: string; // ISO date string
  imageUrl?: string | null; // URL string from NewsAPI, or null
}

export interface SummarizedArticle extends NewsArticle {
  aiSummary: string;
}
