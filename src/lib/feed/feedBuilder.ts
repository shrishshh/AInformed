export interface FeedSections<T> {
  top: T[];
  whatsNewToday?: T[];
  productUpdates: T[];
  modelReleases: T[];
  research: T[];
  byProduct: Record<string, T[]>;
}

export function buildFeed<T extends { updateType?: string; entities?: string[] }>(
  articles: T[],
): FeedSections<T> {
  const withinLast48h = (a: any) => {
    const dateStr = (a.publishedAt || a.pubDate) as string | undefined;
    const dt = dateStr ? new Date(dateStr).getTime() : NaN;
    if (!Number.isFinite(dt)) return false;
    return Date.now() - dt <= 48 * 60 * 60 * 1000;
  };

  // Top stories: full ranked list (no cap; frontend filter is enough)
  const top = articles;
  const whatsNewToday = articles.filter(withinLast48h);

  const productUpdates = articles.filter(
    (a) => a.updateType === "PRODUCT_UPDATE",
  );

  const modelReleases = articles.filter(
    (a) => a.updateType === "MODEL_RELEASE",
  );

  const research = articles.filter((a) => a.updateType === "RESEARCH");

  const byProduct: Record<string, T[]> = {};

  for (const article of articles) {
    if (!article.entities || article.entities.length === 0) continue;

    for (const entity of article.entities) {
      if (!byProduct[entity]) {
        byProduct[entity] = [];
      }
      byProduct[entity].push(article);
    }
  }

  return {
    top,
    whatsNewToday,
    productUpdates,
    modelReleases,
    research,
    byProduct,
  };
}

