import { useEffect, useState } from "react";

function cleanSummary(text: string) {
    return text
      .replace(/\[\d+\]/g, "")                 // remove [1], [23]
      .replace(/\(\d+\s*words?\)/gi, "")       // remove (60 words)
      .replace(/\s{2,}/g, " ")                 // normalize spaces
      .trim()
  }

export function useArticleSummary(text: string) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (!text) return;

    fetch("/api/summary", {
      method: "POST",
      body: JSON.stringify({ text }),
    })
    .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Summary API failed: ${res.status}`)
        }
      
        const text = await res.text()
        if (!text) {
          throw new Error("Empty response from summary API")
        }
      
        return JSON.parse(text)
      })
      .then(data => {
        if (data?.summary) {
          setSummary(cleanSummary(data.summary))
        }
      })
      .catch(err => {
        console.error("Summary generation failed:", err)
      })
      .finally(() => setLoading(false))
      
  }, [text]);

  return { summary, loading };
}
