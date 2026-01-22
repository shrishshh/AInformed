"use client";

import { useMemo, useState } from "react";
import { NewsCardWithBookmark } from "@/components/NewsCardWithBookmark";

interface NewsSectionsProps {
  sections: {
    top?: any[];
    whatsNewToday?: any[];
    productUpdates?: any[];
    modelReleases?: any[];
    research?: any[];
    byProduct?: Record<string, any[]>;
  };
  fallbackArticles?: any[];
}

export function NewsSections({ sections, fallbackArticles = [] }: NewsSectionsProps) {
  const {
    top = [],
    whatsNewToday = [],
    productUpdates = [],
    modelReleases = [],
    research = [],
    byProduct = {},
  } = sections || {};

  const allArticlesForSources = useMemo(() => {
    const all: any[] = [];
    all.push(...top, ...whatsNewToday, ...productUpdates, ...modelReleases, ...research, ...fallbackArticles);
    Object.values(byProduct).forEach((list) => all.push(...(list || [])));
    return all;
  }, [top, whatsNewToday, productUpdates, modelReleases, research, byProduct, fallbackArticles]);

  const sources = useMemo(() => {
    const set = new Set<string>();
    allArticlesForSources.forEach((a) => {
      const name = a?.source?.name || a?.source || "Unknown";
      if (name) set.add(name);
    });
    return ["All", ...Array.from(set).sort()];
  }, [allArticlesForSources]);

  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const filterBySource = (items: any[]) => {
    if (selectedSource === "All") return items;
    return items.filter((a) => (a?.source?.name || a?.source) === selectedSource);
  };

  const getVisibleItems = (sectionKey: string, items: any[], initialCount: number) => {
    const all = filterBySource(items);
    if (expandedSections[sectionKey]) return all;
    return all.slice(0, initialCount);
  };

  const shouldShowMore = (sectionKey: string, items: any[], initialCount: number) => {
    const all = filterBySource(items);
    return !expandedSections[sectionKey] && all.length > initialCount;
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const renderArticlesGrid = (items: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr">
      {items.map((article) => {
        const imageUrl = article.imageUrl || article.image || "";
        return (
          <NewsCardWithBookmark
            key={article.url}
            id={article.url}
            title={article.title}
            summary={article.description || article.summary}
            imageUrl={imageUrl}
            source={article.source?.name || article.source}
            date={article.publishedAt || article.pubDate}
            url={article.url}
            readTime={4}
          />
        );
      })}
    </div>
  );

  const productOrder = ["ChatGPT", "Gemini", "Claude", "Copilot", "LLaMA", "Perplexity"];
  const availableProducts = productOrder.filter(
    (name) => Array.isArray(byProduct[name]) && byProduct[name].length > 0,
  );

  const hasAnyContent =
    top.length > 0 ||
    whatsNewToday.length > 0 ||
    productUpdates.length > 0 ||
    modelReleases.length > 0 ||
    research.length > 0 ||
    availableProducts.length > 0;

  return (
    <div className="flex flex-col gap-12">
      {/* Source filter */}
      {sources.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Filter by source:</label>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {!hasAnyContent && fallbackArticles.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No updates yet. Try a refresh or check back soon.
        </div>
      )}

      {/* 🔥 Today in AI */}
      {filterBySource(top).length > 0 && (
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">🔥 Today in AI</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">The most important AI updates right now.</p>
          {renderArticlesGrid(getVisibleItems("top", top, 8))}
          {shouldShowMore("top", top, 8) && (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-primary hover:underline"
              onClick={() => toggleSection("top")}
            >
              Show more
            </button>
          )}
        </section>
      )}

      {/* 🗓️ What's New (48h) */}
      {filterBySource(whatsNewToday).length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">🗓️ What’s New (Last 48h)</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">Fresh updates from the last two days.</p>
          {renderArticlesGrid(getVisibleItems("whatsNewToday", whatsNewToday, 12))}
          {shouldShowMore("whatsNewToday", whatsNewToday, 12) && (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-primary hover:underline"
              onClick={() => toggleSection("whatsNewToday")}
            >
              Show more
            </button>
          )}
        </section>
      )}

      {/* 🚀 Product Updates */}
      {filterBySource(productUpdates).length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">🚀 Product Updates</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">Concrete changes to AI products and features.</p>
          {renderArticlesGrid(getVisibleItems("productUpdates", productUpdates, 12))}
          {shouldShowMore("productUpdates", productUpdates, 12) && (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-primary hover:underline"
              onClick={() => toggleSection("productUpdates")}
            >
              Show more
            </button>
          )}
        </section>
      )}

      {/* 🧠 Model Releases */}
      {filterBySource(modelReleases).length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">🧠 Model Releases</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">New models, benchmarks, and architecture updates.</p>
          {renderArticlesGrid(getVisibleItems("modelReleases", modelReleases, 10))}
          {shouldShowMore("modelReleases", modelReleases, 10) && (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-primary hover:underline"
              onClick={() => toggleSection("modelReleases")}
            >
              Show more
            </button>
          )}
        </section>
      )}

      {/* 🧪 Research */}
      {filterBySource(research).length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">🧪 Research</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">Deeper dives and papers worth a look.</p>
          {renderArticlesGrid(getVisibleItems("research", research, 10))}
          {shouldShowMore("research", research, 10) && (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-primary hover:underline"
              onClick={() => toggleSection("research")}
            >
              Show more
            </button>
          )}
        </section>
      )}

      {/* 🏷 Product Streams */}
      {availableProducts.length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">🏷 Product Streams</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {availableProducts.map((name) => (
              <span
                key={name}
                className="text-xs md:text-sm px-3 py-1 rounded-full border bg-background hover:bg-muted cursor-default"
              >
                {name}
              </span>
            ))}
          </div>

          {availableProducts.map((name) => {
            const list = filterBySource(byProduct[name] || []);
            if (!list.length) return null;
            return (
              <div key={name} className="mb-10">
                <h3 className="text-lg md:text-xl font-semibold mb-3">{name} updates</h3>
                {renderArticlesGrid(getVisibleItems(`product-${name}`, list, 8))}
                {shouldShowMore(`product-${name}`, list, 8) && (
                  <button
                    type="button"
                    className="mt-4 text-sm font-medium text-primary hover:underline"
                    onClick={() => toggleSection(`product-${name}`)}
                  >
                    Show more
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Fallback: show some recent articles if sections are empty */}
      {hasAnyContent === false && fallbackArticles.length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">Latest AI Updates</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">Sections are warming up — showing recent items.</p>
          {renderArticlesGrid(getVisibleItems("fallback", fallbackArticles, 12))}
          {shouldShowMore("fallback", fallbackArticles, 12) && (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-primary hover:underline"
              onClick={() => toggleSection("fallback")}
            >
              Show more
            </button>
          )}
        </section>
      )}
    </div>
  );
}
