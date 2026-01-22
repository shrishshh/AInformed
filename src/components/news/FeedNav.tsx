"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FeedSection =
  | "all"
  | "today"
  | "whatsNewToday"
  | "productUpdates"
  | "modelReleases"
  | "research"
  | "other";

interface FeedNavProps {
  availableSources: string[];
  availableProducts: string[];
}

const PRIMARY_SOURCES = ["OpenAI", "Google AI", "DeepMind", "Anthropic", "Meta AI", "xAI", "Mistral", "Cohere"];
const PRIMARY_PRODUCTS = ["ChatGPT", "Gemini", "Claude", "LLaMA", "Grok"];

export function FeedNav({ availableSources, availableProducts }: FeedNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSection = (searchParams.get("section") || "all") as FeedSection;
  const currentSource = searchParams.get("source") || "All";
  const currentProduct = searchParams.get("product") || "All";

  const sources = useMemo(() => ["All", ...availableSources], [availableSources]);
  const products = useMemo(() => ["All", ...availableProducts], [availableProducts]);

  const moreSources = useMemo(() => {
    const set = new Set(PRIMARY_SOURCES);
    return sources.filter((s) => s !== "All" && !set.has(s));
  }, [sources]);

  const go = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    // reset paging when changing filters
    params.delete("page");
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "" || v === "All") params.delete(k);
      else params.set(k, v);
    });
    router.push(`/?${params.toString()}`);
  };

  const tab = (label: string, value: FeedSection) => (
    <button
      type="button"
      onClick={() => go({ section: value })}
      className={`text-sm px-3 py-2 rounded-md border ${
        currentSection === value ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 mb-8">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {tab("All", "all")}
        {tab("Today in AI", "today")}
        {tab("Product Updates", "productUpdates")}
        {tab("Model Releases", "modelReleases")}
        {tab("Research", "research")}
        {tab("Other Platforms", "other")}
      </div>

      {/* Source pills + More */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">Sources:</span>
        <button
          type="button"
          onClick={() => go({ source: null })}
          className={`text-xs px-3 py-1 rounded-full border ${
            currentSource === "All" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          All
        </button>

        {PRIMARY_SOURCES.filter((s) => availableSources.includes(s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go({ source: s })}
            className={`text-xs px-3 py-1 rounded-full border ${
              currentSource === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}

        {moreSources.length > 0 && (
          <select
            className="border rounded-md px-2 py-1 text-xs bg-background"
            value={moreSources.includes(currentSource) ? currentSource : ""}
            onChange={(e) => go({ source: e.target.value || null })}
          >
            <option value="">More…</option>
            {moreSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Product pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">Products:</span>
        <button
          type="button"
          onClick={() => go({ product: null })}
          className={`text-xs px-3 py-1 rounded-full border ${
            currentProduct === "All" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          All
        </button>

        {PRIMARY_PRODUCTS.filter((p) => products.includes(p)).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => go({ product: p })}
            className={`text-xs px-3 py-1 rounded-full border ${
              currentProduct === p ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}

        {/* fallback dropdown for the rest */}
        {products.length > PRIMARY_PRODUCTS.length + 1 && (
          <select
            className="border rounded-md px-2 py-1 text-xs bg-background"
            value={!PRIMARY_PRODUCTS.includes(currentProduct) && currentProduct !== "All" ? currentProduct : ""}
            onChange={(e) => go({ product: e.target.value || null })}
          >
            <option value="">More…</option>
            {products
              .filter((p) => p !== "All" && !PRIMARY_PRODUCTS.includes(p))
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
        )}
      </div>
    </div>
  );
}

