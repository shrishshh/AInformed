import { useEffect, useState } from "react";

function cleanSummary(text: string) {
  const t = text
    .replace(/\[\d+\]/g, "") // remove [1], [23]
    .replace(/\(\d+\s*words?\)/gi, "") // remove (60 words)
    .replace(/\s{2,}/g, " ") // normalize spaces
    .trim();

  // Fix common extractive formatting glitches:
  // - missing spaces after sentence punctuation: "necessary.The" -> "necessary. The"
  // - missing spaces after punctuation before quotes/apostrophes: "said.'s" -> "said. 's"
  return t
    .replace(/([.!?])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([.!?])(['"])/g, "$1 $2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extractive summary (₹0) via server endpoint:
 * GET /api/article-summary?url=<articleUrl>
 *
 * - Uses Readability + TextRank/frequency (server-only)
 * - Cached on the server
 */
export function useArticleSummary(params: { url: string; fallbackText?: string }) {
  const { url, fallbackText } = params;
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = (url || "").trim();
    if (!u) {
      setSummary(fallbackText ? cleanSummary(fallbackText) : null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/article-summary?url=${encodeURIComponent(u)}`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Article summary API failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const s = typeof data?.summary === "string" ? data.summary : "";
        if (s) {
          setSummary(cleanSummary(s));
        } else {
          setSummary(fallbackText ? cleanSummary(fallbackText) : null);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Extractive summary failed:", err);
        setSummary(fallbackText ? cleanSummary(fallbackText) : null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url, fallbackText]);

  return { summary, loading };
}
