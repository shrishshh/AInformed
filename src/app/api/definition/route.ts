type DictionaryApiEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{
      definition?: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
};

type DefinitionPayload = {
  standardDefinition: string;
  contextualExplanation: string;
  examples: string[];
};

function normalizeLookupWord(raw: string): string {
  return (raw || "").trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase();
}

function excerptContext(context: string, word: string): string | null {
  const text = (context || "").replace(/\s+/g, " ").trim();
  if (!text || !word) return null;

  const lower = text.toLowerCase();
  const w = word.toLowerCase();
  const idx = lower.indexOf(w);
  if (idx === -1) return null;

  // Grab a readable snippet around the first match.
  const radius = 80;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + w.length + radius);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;
  return snippet;
}

function splitCompoundWord(word: string): string[] {
  const w = (word || "").trim();
  if (!w) return [];

  // 1) Split on hyphen/underscore
  const hy = w.split(/[-_]+/).filter(Boolean);

  // 2) Then split camelCase / PascalCase within each segment
  const parts: string[] = [];
  for (const seg of hy) {
    const spaced = seg
      // fooBar -> foo Bar
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // FOOBar -> FOO Bar
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

    spaced
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => parts.push(s));
  }

  return parts.map((p) => p.toLowerCase()).filter(Boolean);
}

function guessPreferredPartOfSpeech(context: string, word: string): "verb" | "noun" | "adjective" | "adverb" | null {
  const text = (context || "").toLowerCase();
  const w = (word || "").toLowerCase();
  if (!text || !w) return null;

  // Strong signal: modal / "to" directly before the word.
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b(to|will|would|can|could|should|may|might|must|shall)\\s+${esc}\\b`, "i").test(text)) {
    return "verb";
  }

  // Try token-based match (best-effort; context might be short).
  const tokens = text.split(/\s+/).filter(Boolean);
  const wIdx = tokens.findIndex((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") === w);
  const prev = wIdx > 0 ? tokens[wIdx - 1] : "";
  const next = wIdx >= 0 && wIdx < tokens.length - 1 ? tokens[wIdx + 1] : "";

  const modalVerbs = new Set(["will", "would", "can", "could", "should", "may", "might", "must", "shall"]);
  if (prev === "to" || modalVerbs.has(prev)) return "verb";

  const determiners = new Set(["a", "an", "the", "this", "that", "these", "those"]);
  const possessives = new Set(["my", "your", "his", "her", "its", "our", "their"]);
  if (determiners.has(prev) || possessives.has(prev)) {
    // If next token looks like a noun-ish word, current token might be adjective; otherwise noun.
    // Special-case: "enterprise AI", "consumer tech", etc. Dictionaries often only have noun senses
    // that fit better than a verb sense.
    if (next && (next === "ai" || next === "ml" || next === "nlp" || /^[A-Z]{2,}$/.test(next))) return "noun";
    if (next && /^[a-z][a-z-]*$/.test(next) && next.length > 2) return "adjective";
    return "noun";
  }

  // Morphology fallbacks
  if (w.endsWith("ly")) return "adverb";
  if (w.endsWith("ing") || w.endsWith("ed")) return "verb";
  if (/(tion|ment|ness|ship|ity|ism|age|ance|ence|ure|hood|dom|al)$/.test(w)) return "noun";

  return null;
}

function pickDefinitionFromDictionary(entries: DictionaryApiEntry[], preferredPos: string | null): {
  standardDefinition: string | null;
  examples: string[];
} {
  const normalizePos = (p: unknown) => (typeof p === "string" ? p.trim().toLowerCase() : "");
  const posRank = (pos: string): number => {
    // Prefer noun by default, then verb, then adjective/adverb.
    // This avoids cases like "enterprise" being interpreted as a verb.
    switch (pos) {
      case "noun":
        return 0;
      case "verb":
        return 1;
      case "adjective":
        return 2;
      case "adverb":
        return 3;
      default:
        return 10;
    }
  };

  const allMeanings: Array<{ pos: string; definitions: NonNullable<DictionaryApiEntry["meanings"]>[number]["definitions"] }> = [];
  for (const entry of entries || []) {
    for (const meaning of entry.meanings || []) {
      allMeanings.push({ pos: normalizePos(meaning.partOfSpeech), definitions: meaning.definitions || [] });
    }
  }

  const orderedMeanings = (() => {
    const pref = normalizePos(preferredPos);
    if (!pref) return [...allMeanings].sort((a, b) => posRank(a.pos) - posRank(b.pos));
    const preferred = allMeanings.filter((m) => m.pos === pref);
    const rest = allMeanings.filter((m) => m.pos !== pref);
    return [...preferred, ...rest.sort((a, b) => posRank(a.pos) - posRank(b.pos))];
  })();

  const examples: string[] = [];
  for (const meaning of orderedMeanings) {
    const pos = meaning.pos;
    for (const def of meaning.definitions || []) {
      const d = (def.definition || "").trim();
      const ex = typeof def.example === "string" ? def.example.trim() : "";
      if (ex) examples.push(ex);
      if (d) {
        const standard = pos ? `${pos} — ${d}` : d;
        return { standardDefinition: standard, examples: examples.slice(0, 2) };
      }
    }
  }

  return { standardDefinition: null, examples: examples.slice(0, 2) };
}

async function fetchJsonWithTimeout<T>(url: string, ms: number, fetchInit?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...fetchInit, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function stripPosPrefix(definition: string): string {
  return (definition || "").replace(/^(noun|verb|adjective|adverb)\s+—\s+/i, "").trim();
}

function buildHeuristicExplanation(
  original: string,
  parts: string[],
  baseGloss?: { base: string; gloss: string } | null
): string | null {
  const last = parts[parts.length - 1] || "";
  const base = parts.slice(0, -1).join("-").trim();
  if (!base) return null;

  const baseHint = baseGloss?.gloss ? ` (${baseGloss.base}: ${baseGloss.gloss})` : "";
  const patterns: Record<string, (b: string) => string> = {
    sized: (b) => `Something that is approximately the size of ${b}${baseHint}.`,
    powered: (b) => `Something that is powered by ${b}${baseHint}.`,
    native: (b) => `Something that is built for ${b}${baseHint}.`,
    driven: (b) => `Something that is driven by ${b}${baseHint}.`,
    backed: (b) => `Something that is backed or funded by ${b}${baseHint}.`,
    based: (b) => `Something that is based on ${b}${baseHint}.`,
  };

  const gen = patterns[last];
  if (!gen) return null;

  return `Not found in dictionary. Interpreted meaning: ${original} — ${gen(base)} (Derived from word structure.)`;
}

// Simple in-memory cache (works great in dev + long-lived runtimes)
declare global {
  // eslint-disable-next-line no-var
  var __dictionaryDefinitionCache:
    | Map<string, { value: DefinitionPayload; expiresAtMs: number }>
    | undefined;
}

function getCache() {
  if (!globalThis.__dictionaryDefinitionCache) {
    globalThis.__dictionaryDefinitionCache = new Map();
  }
  return globalThis.__dictionaryDefinitionCache;
}

function fallbackPayload(normalizedWord: string) {
  return {
    standardDefinition: `Definition for "${normalizedWord}" could not be loaded.`,
    contextualExplanation: "The service is temporarily unavailable. Please try again.",
    examples: [] as string[],
  };
}

export async function POST(req: Request) {
  let normalizedWord = "";
  let context = "";
  try {
    const body = await req.json();
    const word = body?.word ?? body;
    normalizedWord = typeof word === "string" ? word : word?.word ?? "";
    context = (body?.context ?? "").slice(0, 500);
  } catch {
    return Response.json(fallbackPayload(""), { status: 400 });
  }

  try {
    const lookupWord = normalizeLookupWord(normalizedWord);
    if (!lookupWord) {
      return Response.json(fallbackPayload(""), { status: 200 });
    }

    const preferredPos = guessPreferredPartOfSpeech(context, lookupWord);
    const cacheKey = `${lookupWord}|${preferredPos ?? "any"}`;
    const cache = getCache();
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAtMs > now) {
      return Response.json(cached.value, { status: 200 });
    }

    const tryWords = (() => {
      const w = lookupWord;
      const candidates: string[] = [w];

      // Very light de-inflection fallback (0-cost; improves hit rate).
      if (w.endsWith("ies") && w.length > 4) candidates.push(`${w.slice(0, -3)}y`);
      if (w.endsWith("es") && w.length > 3) candidates.push(w.slice(0, -2));
      if (w.endsWith("s") && w.length > 3) candidates.push(w.slice(0, -1));
      if (w.endsWith("ing") && w.length > 5) {
        candidates.push(w.slice(0, -3));
        candidates.push(`${w.slice(0, -3)}e`);
      }
      if (w.endsWith("ed") && w.length > 4) {
        candidates.push(w.slice(0, -2));
        candidates.push(`${w.slice(0, -2)}e`);
      }

      // Uniq + keep reasonable size
      return Array.from(new Set(candidates)).slice(0, 5);
    })();

    let standardDefinition: string | null = null;
    let examples: string[] = [];

    // 1️⃣ Try dictionary first
    for (const w of tryWords) {
      const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`;
      let json: DictionaryApiEntry[] | null = null;
      try {
        json = await fetchJsonWithTimeout<DictionaryApiEntry[]>(dictUrl, 5000, {
          // Let Next cache at the fetch layer too (when supported)
          next: { revalidate: 60 * 60 * 24 * 7 }, // 7 days
        });
      } catch {
        continue;
      }

      const picked = pickDefinitionFromDictionary(json, preferredPos);
      standardDefinition = picked.standardDefinition;
      examples = picked.examples;
      if (standardDefinition) break;
    }

    // 2️⃣ Split compound words and try dictionary on parts
    if (!standardDefinition) {
      const parts = splitCompoundWord(lookupWord);
      if (parts.length > 1) {
        const defs: Array<{ part: string; def: string } | null> = [];
        const partsToTry = parts.slice(0, 5); // keep it fast

        for (const part of partsToTry) {
          const candidates: string[] = [part];
          // light de-inflection for parts too
          if (part.endsWith("ies") && part.length > 4) candidates.push(`${part.slice(0, -3)}y`);
          if (part.endsWith("es") && part.length > 3) candidates.push(part.slice(0, -2));
          if (part.endsWith("s") && part.length > 3) candidates.push(part.slice(0, -1));
          if (part.endsWith("ing") && part.length > 5) candidates.push(part.slice(0, -3));
          if (part.endsWith("ed") && part.length > 4) candidates.push(part.slice(0, -2));

          let found: string | null = null;
          for (const cand of Array.from(new Set(candidates)).slice(0, 3)) {
            const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cand)}`;
            try {
              const json = await fetchJsonWithTimeout<DictionaryApiEntry[]>(dictUrl, 2500, {
                next: { revalidate: 60 * 60 * 24 * 7 },
              });
              const picked = pickDefinitionFromDictionary(json, "noun");
              if (picked.standardDefinition) {
                found = picked.standardDefinition;
                break;
              }
            } catch {
              // ignore
            }
          }

          defs.push(found ? { part, def: found } : null);
        }

        const anyFound = defs.some(Boolean);
        if (anyFound) {
          // Prefer suffix pattern explanation if possible (X-sized, AI-powered, etc)
          const baseGlossEntry = defs.find((d) => d?.part === parts[0]) || null;
          const baseGloss = baseGlossEntry ? { base: parts[0], gloss: stripPosPrefix(baseGlossEntry.def) } : null;
          const heuristic = buildHeuristicExplanation(lookupWord, parts, baseGloss);

          if (heuristic) {
            standardDefinition = heuristic;
          } else {
            const explainBits = defs
              .filter(Boolean)
              .map((d) => `${d!.part}: ${stripPosPrefix(d!.def)}`)
              .join(" • ");
            standardDefinition = `Not found in dictionary. Derived from word structure: ${lookupWord} = ${parts.join(
              " + "
            )}. ${explainBits}`;
          }
        }
      }
    }

    // 3️⃣ Pattern-based fallback (zero AI)
    if (!standardDefinition) {
      const parts = splitCompoundWord(lookupWord);
      if (parts.length > 1) {
        let baseGloss: { base: string; gloss: string } | null = null;
        try {
          const base = parts[0];
          const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(base)}`;
          const json = await fetchJsonWithTimeout<DictionaryApiEntry[]>(dictUrl, 2500, {
            next: { revalidate: 60 * 60 * 24 * 7 },
          });
          const picked = pickDefinitionFromDictionary(json, "noun");
          if (picked.standardDefinition) baseGloss = { base, gloss: stripPosPrefix(picked.standardDefinition) };
        } catch {
          // ignore
        }
        standardDefinition = buildHeuristicExplanation(lookupWord, parts, baseGloss);
      }
    }

    // UI no longer shows it, so keep it empty (still returned to keep shape stable).
    const contextualExplanation = "";

    const payload: DefinitionPayload = {
      standardDefinition: standardDefinition || `No dictionary entry found for "${lookupWord}".`,
      contextualExplanation,
      examples,
    };

    cache.set(cacheKey, { value: payload, expiresAtMs: now + 1000 * 60 * 60 * 24 * 7 }); // 7 days
    return Response.json(payload, { status: 200 });
  } catch {
    return Response.json(fallbackPayload(normalizedWord || "word"), { status: 200 });
  }
}
