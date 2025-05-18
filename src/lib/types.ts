
export interface NewsArticle {
  id: string; 
  title: string;
  summary: string;
  source: string;
  url: string;
  reliabilityScore: number;
  publishedDate?: string; 
  imageUrl?: string; // Will now store a data URI for generated images or a fallback
  // dataAiHint is no longer needed as images will be generated
}

export interface SummarizedArticle extends NewsArticle {
  aiSummary: string;
}
