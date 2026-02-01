import { useEffect, useState } from "react";

function cleanSummary(text: string) {
  let t = text
    .replace(/\[\d+\]/g, "") // remove [1], [23]
    .replace(/\(\d+\s*words?\)/gi, "") // remove (60 words)
    .replace(/\s{2,}/g, " ") // normalize spaces
    .trim();

  // Remove common "roundup" / meta prefixes from RSS/OG snippets (fallbackText)
  t = t.replace(/^\s*plus\s*:\s*/i, "");
  t = t.replace(/^\s*the\s+article\s+(covers|explores|looks\s+at|is\s+about)\b[:\s-]*/i, "");
  t = t.replace(/^\s*in\s+this\s+(article|story)\b[:\s-]*/i, "");

  // Fix common extractive formatting glitches:
  // - missing spaces after sentence punctuation: "necessary.The" -> "necessary. The"
  // - missing spaces after punctuation before quotes/apostrophes: "said.'s" -> "said. 's"
  t = t
    .replace(/([.!?])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([.!?])(['"])/g, "$1 $2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Avoid ugly "...." / trailing ellipses from upstream snippets
  t = t.replace(/(\.{3,}|…)\s*$/g, "").trim();
  // Collapse any remaining "...." to "..."
  t = t.replace(/\.{4,}/g, "...");
  return t;
}

function enforceMaxWords(text: string, maxWords = 60) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  const limited = words.slice(0, maxWords).join(" ").trim();
  if (!limited) return "";
  // Don't append "..." here; the UI already truncates with CSS.
  return limited;
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
          setSummary(enforceMaxWords(cleanSummary(s), 60));
        } else {
          setSummary(fallbackText ? enforceMaxWords(cleanSummary(fallbackText), 60) : null);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Extractive summary failed:", err);
        setSummary(fallbackText ? enforceMaxWords(cleanSummary(fallbackText), 60) : null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url, fallbackText]);

  return { summary, loading };
}
