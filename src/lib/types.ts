
export interface NewsArticle {
  id: string; // Add an ID for managing saved articles, can be URL or generated
  title: string;
  summary: string;
  source: string;
  url: string;
  reliabilityScore: number;
  publishedDate?: string; // Optional: good for sorting/display
  imageUrl?: string; // Optional: for article cards
}

export interface SummarizedArticle extends NewsArticle {
  aiSummary: string;
}
