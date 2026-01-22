import {
  PRODUCT_UPDATE_KEYWORDS,
  MODEL_RELEASE_KEYWORDS,
  API_UPDATE_KEYWORDS,
  IGNORE_KEYWORDS,
} from "./keywordRules";

export type UpdateType =
  | "PRODUCT_UPDATE"
  | "MODEL_RELEASE"
  | "API_UPDATE"
  | "RESEARCH"
  | "IGNORE";

export interface ClassifiableArticle {
  title: string;
  url?: string;
  summary?: string;
}

function textMatchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

export function classifyUpdate(article: ClassifiableArticle): UpdateType {
  const { title, url, summary } = article;
  const combinedText = `${title} ${summary ?? ""} ${url ?? ""}`.toLowerCase();

  // 1) IGNORE has highest priority to avoid misclassifying thought pieces as releases
  if (textMatchesAny(combinedText, IGNORE_KEYWORDS)) {
    return "IGNORE";
  }

  // 2) Product updates (UI/features/availability changes)
  if (textMatchesAny(combinedText, PRODUCT_UPDATE_KEYWORDS)) {
    return "PRODUCT_UPDATE";
  }

  // 3) Model releases (technical reports, benchmarks, new architectures)
  if (textMatchesAny(combinedText, MODEL_RELEASE_KEYWORDS)) {
    return "MODEL_RELEASE";
  }

  // 4) API / developer surface changes
  if (textMatchesAny(combinedText, API_UPDATE_KEYWORDS)) {
    return "API_UPDATE";
  }

  // 5) Fallback: treat obviously research-style posts as RESEARCH
  if (
    /\b(report|paper|arxiv|preprint|study|research|technical report|benchmark)\b/i.test(
      combinedText,
    )
  ) {
    return "RESEARCH";
  }

  // 6) Default: not a concrete user-facing update
  return "IGNORE";
}

