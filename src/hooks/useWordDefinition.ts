import { useState, useEffect } from "react";

interface WordDefinition {
  standardDefinition: string;
  contextualExplanation: string;
  examples: string[];
}

function normalizeWord(word: string | { word?: string } | null): string | null {
  if (word == null) return null;
  if (typeof word === "string") return word.trim() || null;
  const w = word?.word;
  return typeof w === "string" ? w.trim() || null : null;
}

export function useWordDefinition(word: string | { word?: string } | null, context: string) {
  const [data, setData] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(false);

  const wordStr = normalizeWord(word);

  useEffect(() => {
    if (!wordStr) return;

    setLoading(true);

    fetch("/api/definition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: wordStr, context: context ?? "" }),
    })
      .then(async (res) => {
        const text = await res.text();
        if (!text.trim()) {
          setData({
            standardDefinition: "Definition could not be loaded.",
            contextualExplanation: "The response was empty. Please try again.",
            examples: [],
          });
          return;
        }
        let parsed: WordDefinition;
        try {
          const json = JSON.parse(text);
          parsed = {
            standardDefinition: json.standardDefinition ?? "",
            contextualExplanation: json.contextualExplanation ?? "",
            examples: Array.isArray(json.examples) ? json.examples : [],
          };
        } catch {
          parsed = {
            standardDefinition: "Definition could not be loaded.",
            contextualExplanation: "The response was invalid. Please try again.",
            examples: [],
          };
        }
        setData(parsed);
      })
      .catch(() => {
        setData({
          standardDefinition: "Definition could not be loaded.",
          contextualExplanation: "Network error. Please try again.",
          examples: [],
        });
      })
      .finally(() => setLoading(false));
  }, [wordStr, context]);

  return { data, loading };
}
