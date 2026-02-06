import { useEffect, useState } from "react";

function cleanSummary(text: string) {
  let t = (text || "")
    .replace(/\[\d+\]/g, "")
    .replace(/\(\d+\s*words?\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*plus\s*:\s*/i, "")
    .trim();

  // Strip common arXiv / metadata noise that can leak into summaries
  t = t.replace(/\bSubjects?:\b[\s\S]*$/i, ""); // drop trailing "Subjects: ..."
  t = t.replace(/\b(arxiv|arXiv)\s*:\s*\d{4}\.\d{4,5}(v\d+)?/gi, "");
  t = t.replace(/\bdoi\s*:\s*[^\s]+/gi, "");
  t = t.replace(/https?:\/\/\S+/gi, ""); // URLs
  t = t.replace(/\[[A-Z]{2}\]/g, ""); // e.g. [LG], [CS]

  // Collapse leftover spacing/punctuation issues
  t = t
    .replace(/([.!?])([A-Za-z0-9])/g, "$1 $2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  return t;
}

type UsePaperSummaryParams = {
  abstract?: string;
  link?: string;
};

export function usePaperSummary(params: UsePaperSummaryParams) {
  const { abstract, link } = params;
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!link && !abstract) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch("/api/paper-summary", {
      method: "POST",
      body: JSON.stringify({ text: abstract, abstract, link }),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Paper summary API failed: ${res.status}`);
        const body = await res.text();
        if (!body) throw new Error("Empty response from paper summary API");
        return JSON.parse(body);
      })
      .then((data) => {
        if (data?.summary) setSummary(cleanSummary(data.summary));
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Paper summary generation failed:", err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [abstract, link]);

  return { summary, loading };
}
