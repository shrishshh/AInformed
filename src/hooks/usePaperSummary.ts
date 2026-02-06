import { useEffect, useState } from "react";

function cleanSummary(text: string) {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/\(\d+\s*words?\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function usePaperSummary(abstract: string) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!abstract) {
      setLoading(false);
      return;
    }

    fetch("/api/paper-summary", {
      method: "POST",
      body: JSON.stringify({ text: abstract }),
      headers: { "Content-Type": "application/json" },
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
      .catch((err) => console.error("Paper summary generation failed:", err))
      .finally(() => setLoading(false));
  }, [abstract]);

  return { summary, loading };
}
