import { OFFICIAL_AI_SOURCES } from "@/lib/sources/officialSources";

type UpdateType =
  | "PRODUCT_UPDATE"
  | "MODEL_RELEASE"
  | "API_UPDATE"
  | "RESEARCH";

export interface RankableArticle {
  source?: string;
  pubDate: string;
  updateType?: UpdateType;
}

const SOURCE_TYPE_WEIGHT: Record<string, number> = {
  OFFICIAL_BLOG: 100,
  CHANGELOG: 100,
  RESEARCH_LAB: 80,
  TECH_NEWS: 50,
  AGGREGATOR: 20,
};

const UPDATE_TYPE_WEIGHT: Record<UpdateType, number> = {
  PRODUCT_UPDATE: 40,
  MODEL_RELEASE: 35,
  API_UPDATE: 30,
  RESEARCH: 20,
};

function getSourcePriority(sourceName?: string): number {
  if (!sourceName) return 0;

  const lower = sourceName.toLowerCase();

  const match = OFFICIAL_AI_SOURCES.find(
    (s) =>
      lower.includes(s.company.toLowerCase()) ||
      lower.includes(s.id.toLowerCase()),
  );

  if (!match) return 10; // small default boost for unknown sources

  const sourceTypeWeight = match.sourceType ? SOURCE_TYPE_WEIGHT[match.sourceType] ?? 0 : 0;
  return sourceTypeWeight > 0 ? sourceTypeWeight : 10;
}

function getRecencyWeight(pubDate: string): number {
  const ageMs = Date.now() - new Date(pubDate).getTime();
  const hours = ageMs / (1000 * 60 * 60);

  if (hours < 6) return 20;
  if (hours < 24) return 10;
  if (hours < 72) return 5;

  return 0;
}

export function scoreArticle(article: RankableArticle): number {
  let score = 0;

  score += getSourcePriority(article.source);
  score += article.updateType ? UPDATE_TYPE_WEIGHT[article.updateType] : 0;
  score += getRecencyWeight(article.pubDate);

  return score;
}

export function rankArticles<T extends RankableArticle>(articles: T[]): T[] {
  return articles
    .map((a) => ({ ...a, _score: scoreArticle(a) }))
    .sort((a, b) => b._score - a._score);
}

