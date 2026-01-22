export type SourceTrustLevel = "HIGH" | "MEDIUM" | "LOW";

export type SourceFetchMethod = "RSS" | "LISTING_PAGE" | "NONE";

export type SourceContentType =
  | "PRODUCT_UPDATE"
  | "MODEL_RELEASE"
  | "API_UPDATE"
  | "RESEARCH"
  | "GENERAL";

export interface OfficialSource {
  id: string;
  company: string;
  products: string[];
  website: string;
  rss?: string;
  /**
   * How we fetch updates for this source.
   * - RSS: use rss field
   * - LISTING_PAGE: discover links from a listing page (no RSS available)
   * - NONE: present for reference only
   */
  fetchMethod: SourceFetchMethod;
  /**
   * Optional listing page URL used for LISTING_PAGE discovery.
   * Defaults to website if omitted.
   */
  listingUrl?: string;
  trust: SourceTrustLevel;
  contentTypes: SourceContentType[];
  /**
   * Source category used for ranking.
   * OFFICIAL_BLOG > CHANGELOG > RESEARCH_LAB > TECH_NEWS > AGGREGATOR
   */
  sourceType: "OFFICIAL_BLOG" | "CHANGELOG" | "RESEARCH_LAB" | "TECH_NEWS" | "AGGREGATOR";
  /**
   * Deprecated: legacy numeric priority (kept for backward compatibility).
   */
  priority?: number;
}

