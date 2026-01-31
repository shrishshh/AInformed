export type SourceFetchMethod = "RSS" | "LISTING_PAGE" | "NONE";

export type SourceTrustLevel = "HIGH" | "MEDIUM" | "LOW";

export type SourceContentType =
  | "PRODUCT_UPDATE"
  | "MODEL_RELEASE"
  | "API_UPDATE"
  | "RESEARCH"
  | "NEWS"
  | "OTHER";

export type SourceType =
  | "OFFICIAL_BLOG"
  | "CHANGELOG"
  | "RESEARCH_LAB"
  | "TECH_NEWS"
  | "AGGREGATOR";

export interface OfficialSource {
  id: string;
  company: string; // display name, used as article.source
  products: string[];
  website: string;
  rss?: string;
  fetchMethod: SourceFetchMethod;
  listingUrl?: string;
  trust: SourceTrustLevel;
  contentTypes: SourceContentType[];
  sourceType: SourceType;
  priority?: number; // optional manual override if needed
}

