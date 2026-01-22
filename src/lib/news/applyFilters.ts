export type ContentTypeFilter =
  | "ALL"
  | "TODAY"
  | "PRODUCT_UPDATES"
  | "MODEL_RELEASES"
  | "RESEARCH"
  | "OTHER_PLATFORMS";

export type ProductFilter = "All" | "ChatGPT" | "Gemini" | "Claude" | "LLaMA" | "Grok";

export interface FilterState {
  contentType: ContentTypeFilter;
  source: string | null; // exact label, matched case-insensitively
  product: ProductFilter;
}

type ArticleLike = {
  title?: string;
  summary?: string;
  description?: string;
  pubDate?: string;
  publishedAt?: string;
  updateType?: string;
  entities?: string[];
  sourceType?: string;
  source?: any;
  _isHN?: boolean;
  _isGDELT?: boolean;
  _isGNews?: boolean;
};

const PRODUCT_KEYWORDS: Record<Exclude<ProductFilter, "All">, string[]> = {
  ChatGPT: ["chatgpt", "gpt", "openai chat"],
  Gemini: ["gemini", "google gemini", "bard"],
  Claude: ["claude", "anthropic"],
  LLaMA: ["llama", "l.la.ma", "meta llama"],
  Grok: ["grok", "xai", "x.ai"],
};

function getSourceName(article: ArticleLike): string {
  const raw = (article as any)?.source?.name ?? (article as any)?.source ?? "";
  return typeof raw === "string" ? raw : "";
}

function getPublishedAt(article: ArticleLike): Date | null {
  const raw = article.publishedAt || article.pubDate;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchesProduct(article: ArticleLike, product: Exclude<ProductFilter, "All">): boolean {
  const entities = Array.isArray(article.entities) ? article.entities : [];
  if (entities.some((e) => e.toLowerCase() === product.toLowerCase())) return true;

  const title = (article.title || "").toLowerCase();
  const kws = PRODUCT_KEYWORDS[product];
  return kws.some((k) => title.includes(k));
}

function isOtherPlatform(article: ArticleLike): boolean {
  const st = (article.sourceType || "").toUpperCase();
  if (st === "TECH_NEWS" || st === "AGGREGATOR") return true;
  return Boolean(article._isHN || article._isGDELT || article._isGNews);
}

export function applyFilters<T extends ArticleLike>(articles: T[], filters: FilterState): T[] {
  const sourceNeedle = (filters.source || "").trim().toLowerCase();

  return articles.filter((a) => {
    // Source filter (case-insensitive exact match on label)
    if (filters.source) {
      const src = getSourceName(a).trim().toLowerCase();
      if (!src || src !== sourceNeedle) return false;
    }

    // Product filter
    if (filters.product !== "All") {
      if (!matchesProduct(a, filters.product)) return false;
    }

    // Content type filter
    if (filters.contentType === "ALL") return true;

    if (filters.contentType === "TODAY") {
      const d = getPublishedAt(a);
      if (!d) return false;
      const hours = (Date.now() - d.getTime()) / (1000 * 60 * 60);
      return hours <= 24;
    }

    if (filters.contentType === "PRODUCT_UPDATES") return a.updateType === "PRODUCT_UPDATE";
    if (filters.contentType === "MODEL_RELEASES") return a.updateType === "MODEL_RELEASE";
    if (filters.contentType === "RESEARCH") return a.updateType === "RESEARCH";

    // OTHER_PLATFORMS
    return isOtherPlatform(a) || !["PRODUCT_UPDATE", "MODEL_RELEASE", "RESEARCH", "API_UPDATE"].includes(a.updateType || "");
  });
}

