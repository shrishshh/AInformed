import { PRODUCT_ENTITIES } from "./productEntities";

interface TaggableArticle {
  title: string;
  summary?: string;
  source?: string;
}

export function tagEntities(article: TaggableArticle): string[] {
  const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();

  const matchedEntities = PRODUCT_ENTITIES.filter((entity) =>
    entity.aliases.some((alias) => text.includes(alias.toLowerCase())),
  );

  return matchedEntities.map((e) => e.displayName);
}

