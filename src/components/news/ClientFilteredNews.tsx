"use client";

import { useMemo, useState } from "react";
import { FilterButton } from "@/components/news/filters/FilterButton";
import { ExploreSourcesModal } from "@/components/news/filters/ExploreSourcesModal";
import { NewsCardWithBookmark } from "@/components/NewsCardWithBookmark";
import { applyFilters, type ContentTypeFilter, type FilterState, type ProductFilter } from "@/lib/news/applyFilters";

type Article = any;

const CONTENT_TABS: { label: string; value: ContentTypeFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Today in AI", value: "TODAY" },
  { label: "Product Updates", value: "PRODUCT_UPDATES" },
  { label: "Model Releases", value: "MODEL_RELEASES" },
  { label: "Research", value: "RESEARCH" },
  { label: "Other Platforms", value: "OTHER_PLATFORMS" },
];

const PRIMARY_SOURCES = ["OpenAI", "Google AI", "DeepMind", "Anthropic", "Meta AI", "xAI"];

const PRODUCT_PILLS: ProductFilter[] = ["All", "ChatGPT", "Gemini", "Claude", "LLaMA", "Grok"];

function normalizeSourceName(article: any): string {
  return (article?.source?.name ?? article?.source ?? "") as string;
}

export function ClientFilteredNews({ articles }: { articles: Article[] }) {
  const [filters, setFilters] = useState<FilterState>({
    contentType: "ALL",
    source: null,
    product: "All",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const availableSources = useMemo(() => {
    const fixed = [
      "OpenAI",
      "Google AI",
      "DeepMind",
      "Anthropic",
      "Meta AI",
      "xAI",
      "Mistral",
      "Cohere",
      "Hugging Face",
      "Microsoft",
      "Microsoft Research",
      "NVIDIA",
      "HackerNews",
      "TechCrunch AI",
      "VentureBeat AI",
      "Wired",
      "ZDNet",
      "GDELT",
    ];

    const fromData = Array.from(
      new Set(
        (articles || [])
          .map((a) => normalizeSourceName(a))
          .filter((s) => typeof s === "string" && s.trim().length > 0),
      ),
    );

    const merged = Array.from(new Set([...fixed, ...fromData]));
    return merged.sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const filtered = useMemo(() => applyFilters(articles || [], filters), [articles, filters]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  const setFilter = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  };

  return (
    <div className="w-full">
      {/* CONTENT TYPE */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold tracking-wide">
          <span className="text-muted-foreground">CONTENT TYPE</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {CONTENT_TABS.map((t) => (
            <FilterButton
              key={t.value}
              active={filters.contentType === t.value}
              onClick={() => setFilter({ contentType: t.value })}
            >
              {t.label}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* SOURCES + PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-semibold">SOURCES</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FilterButton active={!filters.source} onClick={() => setFilter({ source: null })} className="col-span-2">
              All Sources
            </FilterButton>

            {PRIMARY_SOURCES.map((s) => (
              <FilterButton
                key={s}
                active={(filters.source || "").toLowerCase() === s.toLowerCase()}
                onClick={() => setFilter({ source: s })}
              >
                {s}
              </FilterButton>
            ))}

            <FilterButton
              active={false}
              onClick={() => setIsModalOpen(true)}
              className="col-span-2 border-dashed bg-background hover:bg-muted"
            >
              + Explore More
            </FilterButton>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="font-semibold">PRODUCTS</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PRODUCT_PILLS.map((p) => (
              <FilterButton key={p} active={filters.product === p} onClick={() => setFilter({ product: p })}>
                {p}
              </FilterButton>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <ExploreSourcesModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          sources={availableSources}
          selectedSource={filters.source}
          onSelectSource={(s) => setFilter({ source: s })}
        />
      ) : null}

      {/* RESULTS */}
      <div className="rounded-2xl border bg-muted/10 px-4 py-3 mb-6 text-sm">
        <span className="font-semibold">Showing</span>{" "}
        <span className="text-primary">
          {filters.contentType === "ALL"
            ? "All"
            : CONTENT_TABS.find((t) => t.value === filters.contentType)?.label}
        </span>
        {filters.source ? (
          <>
            {" "}
            · <span className="text-muted-foreground">Source:</span> <span className="font-medium">{filters.source}</span>
          </>
        ) : null}
        {filters.product !== "All" ? (
          <>
            {" "}
            · <span className="text-muted-foreground">Product:</span> <span className="font-medium">{filters.product}</span>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr">
        {pageItems.map((article: any) => {
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

      {/* CLIENT PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="text-sm text-muted-foreground">
          Showing {totalItems === 0 ? 0 : start + 1} to {Math.min(end, totalItems)} of {totalItems} results
        </div>

        <div className="flex items-center gap-2">
          <FilterButton active={false} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2">
            Previous
          </FilterButton>
          <div className="flex items-center gap-1 px-3 py-2 text-sm">
            <span className="font-medium">Page</span>
            <span className="font-bold">{safePage}</span>
            <span>of</span>
            <span className="font-bold">{totalPages}</span>
          </div>
          <FilterButton
            active={false}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-2"
          >
            Next
          </FilterButton>
        </div>
      </div>
    </div>
  );
}

