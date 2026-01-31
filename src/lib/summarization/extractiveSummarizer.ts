import "server-only";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { createRequire } from "module";

type ExtractedArticle = {
  title: string;
  text: string;
  excerpt: string;
  siteName?: string;
  byline?: string;
  length?: number;
};

export type ExtractiveSummaryResult = ExtractedArticle & {
  sourceUrl: string;
  summary: string;
  summaryWordCount: number;
  method: "readability+textrank";
};

const require = createRequire(import.meta.url);
const { SummarizerManager } = require("node-summarizer") as {
  SummarizerManager: new (text: string, sentences: number) => {
    getSummaryByRank: () => Promise<{ summary?: unknown } | unknown>;
    getSummaryByFrequency: () => { summary?: unknown } | unknown;
  };
};

const SUMMARY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SUMMARY_CACHE_VERSION = "v3";
const summaryCache = new Map<string, { fetchedAt: number; value: ExtractiveSummaryResult }>();

function normalizeWhitespace(text: string): string {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function stripWeirdSpaces(text: string): string {
  return (text || "")
    .replace(/\u00a0/g, " ") // nbsp
    .replace(/\u200b/g, "") // zero width space
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePunctuationSpacing(text: string): string {
  let t = stripWeirdSpaces(text);
  if (!t) return "";

  // Ensure a space after sentence punctuation when followed by a letter/number/quote.
  // Example: "necessary.The" -> "necessary. The"
  t = t.replace(/([.!?])([A-Za-z0-9])/g, "$1 $2");

  // Ensure a space after punctuation before opening quotes/apostrophes.
  // Example: "said.'s" -> "said. 's" (we handle orphan "'s" below)
  t = t.replace(/([.!?])(['"“”‘’])/g, "$1 $2");

  // Remove spaces before punctuation
  t = t.replace(/\s+([,.;:!?])/g, "$1");

  // Normalize weird quote characters
  t = t
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Collapse any double spaces created by replacements
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

function capitalizeSentenceStarts(text: string): string {
  const t = normalizePunctuationSpacing(text);
  if (!t) return "";
  return t.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p1: string, p2: string) => `${p1}${p2.toUpperCase()}`);
}

function removeOrphanContractions(text: string): string {
  let t = normalizePunctuationSpacing(text);
  if (!t) return "";

  // Sometimes extraction produces sentence fragments like: "he said. 's research fellow..."
  // Drop leading orphan "'s"/"’s" fragments at the start of a sentence.
  t = t.replace(/(^|[.!?]\s+)('s)\b/gi, "$1");

  // If we now have double punctuation spacing, re-normalize.
  t = normalizePunctuationSpacing(t);
  return t;
}

function postProcessSummary(text: string): string {
  let t = removeOrphanContractions(text);

  // Remove very common low-signal CTA phrases that sometimes slip through.
  t = t.replace(/\b(make sure to|don['’]t forget to)\s+click\s+the\s+follow\s+button!?/gi, "");
  t = t.replace(/\bclick\s+the\s+follow\s+button!?/gi, "");
  t = t.replace(/^\s*plus\s*:\s*/i, "");

  // Final cleanup
  t = normalizePunctuationSpacing(t);

  // Drop obvious list/bullet artifacts that can slip into summaries.
  // (Some publishers inject numbered UI fragments inside the main content.)
  const parts = t
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => {
      if (/^\d+(\s|[.)])/i.test(s)) return false;
      if (/^\d+\s+and\s+\d+/i.test(s)) return false;
      if (/\bwe tried to make\b/i.test(s)) return false;
      // Drop very short numeric fragments
      const nums = s.match(/\d+/g) || [];
      if (nums.length >= 1 && wordCount(s) <= 5) return false;
      return true;
    });
  t = parts.join(" ").trim();
  t = normalizePunctuationSpacing(t);

  // Avoid broken/unmatched quotes in tight 60-word summaries.
  // If quotes are unbalanced, drop them rather than rendering odd leading quotes.
  const quoteCount = (t.match(/"/g) || []).length;
  if (quoteCount % 2 === 1) {
    t = t.replace(/"/g, "");
    t = normalizePunctuationSpacing(t);
  }
  t = capitalizeSentenceStarts(t);
  return t;
}

const TRAILING_JUNK_WORDS = new Set([
  "one",
  "and",
  "but",
  "or",
  "so",
  "because",
  "however",
  "therefore",
  "thus",
  "also",
  "then",
  "the",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
]);

function dropTrailingJunkWords(text: string, maxDrop = 3): string {
  const words = stripWeirdSpaces(text).split(" ").filter(Boolean);
  let dropped = 0;
  while (words.length > 0 && dropped < maxDrop) {
    const last = (words[words.length - 1] || "").replace(/[^A-Za-z]/g, "").toLowerCase();
    if (!last) break;
    if (!TRAILING_JUNK_WORDS.has(last)) break;
    words.pop();
    dropped += 1;
  }
  return words.join(" ").trim();
}

function trimToSentenceBoundaryWithinLimit(text: string, minWordsToKeep = 24): string {
  const t = normalizePunctuationSpacing(text);
  if (!t) return "";

  // Try to end on a sentence boundary to avoid abrupt cut-offs.
  // We search from the end for the last ., !, ? (not part of an abbreviation heuristic—simple).
  const idx = Math.max(t.lastIndexOf("."), t.lastIndexOf("!"), t.lastIndexOf("?"));
  if (idx <= 0) return t;

  const candidate = t.slice(0, idx + 1).trim();
  return wordCount(candidate) >= minWordsToKeep ? candidate : t;
}

function finalizeSummary(text: string, maxWords: number): { summary: string; summaryWordCount: number } {
  // 1) cleanup/normalization
  let t = postProcessSummary(text);

  // 2) enforce word cap AFTER cleanup (important!)
  let { text: limited, trimmed } = trimToWordLimit(t, maxWords);

  // 3) if we had to cut, avoid ending on junk connectors like "One", "And", etc.
  if (trimmed) {
    limited = dropTrailingJunkWords(limited);
    limited = normalizePunctuationSpacing(limited);
    limited = trimToSentenceBoundaryWithinLimit(limited, 22);
  }

  // IMPORTANT: don't append "..." here; the UI already truncates with CSS line-clamp.
  // Make sure spacing fixes can't push us over the limit.
  const { text: finalLimited } = trimToWordLimit(limited, maxWords);
  const finalFinal = finalLimited.trim();
  return { summary: finalFinal, summaryWordCount: wordCount(finalFinal) };
}

const SENTENCE_BLACKLIST: RegExp[] = [
  // Photo credits / wires / agencies
  /\b(getty images?|reuters|associated press|ap photo|bloomberg)\b/i,
  /\b(photo|image)\s*:\b/i,
  /\b(caption)\b/i,
  /\bcredit\s*:\b/i,
  /\bvia\s+(reuters|ap|associated press|bloomberg)\b/i,

  // Publisher UI / promos / newsletter CTAs
  /\b(sign up|subscribe|subscription|newsletter)\b/i,
  /\b(read more|learn more)\b/i,
  /\b(follow)\b.*\b(button|us|page|channel)\b/i,
  /\b(click)\b.*\b(follow|subscribe|sign up)\b/i,
  /\b(related|recommended)\s+(stories|articles)\b/i,
  /\b(advertisement|sponsored)\b/i,
  /\bwatch live\b/i,
  // Meta “about this article” lines
  /^\s*plus\s*:/i,
  /^\s*the\s+article\s+(covers|explores|looks\s+at|is\s+about)\b/i,
  /^\s*here['’]s\s+how\b/i,
  /^\s*in\s+this\s+(article|story)\b/i,

  // Time/location headers often embedded near captions
  /\b(updated|published)\s*:\b/i,
];

function looksLikeCaptionOrCredit(s: string): boolean {
  const t = stripWeirdSpaces(s);
  if (!t) return true;

  // Many publishers format credits like: "Name | Outlet | Getty Images"
  if (t.includes("|")) {
    const parts = t.split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // If any part looks like a wire/agency credit, drop it.
      if (SENTENCE_BLACKLIST.some((re) => re.test(t))) return true;
      // Or if it's mostly short tokens (typical credit line)
      const avgWords = parts.reduce((sum, p) => sum + wordCount(p), 0) / parts.length;
      if (avgWords <= 4) return true;
    }
  }

  // Very short lines that match common caption patterns
  if (wordCount(t) <= 6 && SENTENCE_BLACKLIST.some((re) => re.test(t))) return true;

  return false;
}

function cleanTextForSummarization(text: string): string {
  const t = normalizeWhitespace(text);
  if (!t) return "";

  // Split into best-effort sentences; keep the splitter consistent with takeLeadSentences.
  const sentences = t
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const cleaned = sentences.filter((s) => {
    const normalized = normalizePunctuationSpacing(s);

    // Remove caption/credit-like sentences
    if (looksLikeCaptionOrCredit(normalized)) return false;
    // Remove anything matching blacklist patterns
    if (SENTENCE_BLACKLIST.some((re) => re.test(normalized))) return false;
    // Remove sentence fragments that start with orphan contractions (usually extraction artifacts)
    if (/^['"]?s\b/i.test(normalized)) return false;
    // Drop list/bullet artifacts that often pollute summaries
    if (/^\d+(\s|[.)])/i.test(normalized)) return false;
    if (/^\d+\s+and\s+\d+/i.test(normalized)) return false;
    // Drop weird all-lowercase attribution fragments (common after stripping "'s")
    if (/^[a-z]/.test(normalized) && /\bsaid\b/i.test(normalized) && !/[A-Z]/.test(normalized)) return false;
    // Remove very short “noise” sentences with no real content
    if (wordCount(normalized) <= 3) return false;
    return true;
  });

  // If our filter was too aggressive, fall back to original text.
  const cleanedText = cleaned.join(" ").trim();
  // Prefer cleaned text unless it becomes effectively empty.
  // Falling back to raw text often re-introduces captions/CTAs/list bullets.
  if (wordCount(cleanedText) >= 20) return cleanedText;
  if (cleanedText) return cleanedText;
  return t;
}

function wordCount(text: string): number {
  const t = stripWeirdSpaces(text);
  if (!t) return 0;
  return t.split(" ").filter(Boolean).length;
}

function trimToWordLimit(text: string, maxWords: number): { text: string; trimmed: boolean } {
  const t = stripWeirdSpaces(text);
  const words = t.split(" ").filter(Boolean);
  if (words.length <= maxWords) return { text: t, trimmed: false };
  return { text: words.slice(0, maxWords).join(" "), trimmed: true };
}

function addEllipsisIfTrimmed(text: string, trimmed: boolean): string {
  const t = text.trim();
  if (!trimmed) return t;
  // Avoid double ellipsis
  if (/[.…]$/.test(t) || t.endsWith("...")) return t;
  return `${t}...`;
}

function takeLeadSentences(text: string, sentenceCount: number): string {
  const t = cleanTextForSummarization(text);
  if (!t) return "";

  // Keep it simple and fast: split on sentence boundaries (best-effort).
  const parts = t
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return t;
  return parts.slice(0, Math.max(1, sentenceCount)).join(" ");
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Basic SSRF guard for user-provided URLs. (Not perfect; stops the common bad cases.)
export function isSafePublicHttpUrl(url: string): boolean {
  if (!isHttpUrl(url)) return false;
  try {
    const u = new URL(url);
    const host = (u.hostname || "").toLowerCase().trim();

    if (!host) return false;
    if (host === "localhost" || host.endsWith(".localhost")) return false;
    if (host.endsWith(".local")) return false;

    // Block obvious internal / metadata hostnames
    const blockedHosts = new Set([
      "metadata.google.internal",
      "169.254.169.254", // AWS/GCP/Azure metadata IP
    ]);
    if (blockedHosts.has(host)) return false;

    // If hostname is an IP literal, block private ranges
    const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    if (isIpv4) {
      const parts = host.split(".").map((n) => Number(n));
      if (parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return false;
      const [a, b] = parts;

      // 10.0.0.0/8
      if (a === 10) return false;
      // 127.0.0.0/8
      if (a === 127) return false;
      // 169.254.0.0/16
      if (a === 169 && b === 254) return false;
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return false;
      // 192.168.0.0/16
      if (a === 192 && b === 168) return false;
      // 0.0.0.0/8
      if (a === 0) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function extractReadableArticle(url: string): Promise<ExtractedArticle | null> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AInformed/1.0; +https://www.ainformed.in)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    next: { revalidate: Math.floor(SUMMARY_TTL_MS / 1000) },
  });

  if (!res.ok) return null;
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) return null;

  return {
    title: stripWeirdSpaces(article.title || ""),
    text: normalizeWhitespace(article.textContent || ""),
    excerpt: stripWeirdSpaces(article.excerpt || ""),
    siteName: stripWeirdSpaces((article as any).siteName || ""),
    byline: stripWeirdSpaces(article.byline || ""),
    length: typeof article.length === "number" ? article.length : undefined,
  };
}

export async function summarizeExtractiveText(params: {
  text: string;
  sentenceCount?: number;
  maxWords?: number;
}): Promise<{ summary: string; summaryWordCount: number }> {
  // Ask for more than needed; we hard-trim to 60 words afterward.
  const sentenceCount = params.sentenceCount ?? 5;
  const maxWords = params.maxWords ?? 60;
  const text = cleanTextForSummarization(params.text || "");

  if (!text) return { summary: "", summaryWordCount: 0 };

  let rawSummary = "";
  try {
    let summarizer = new SummarizerManager(text, sentenceCount);
    // Prefer TextRank (news-style), fall back to frequency if it fails.
    const rankObj = await summarizer.getSummaryByRank();
    const rankSummary = (rankObj as any)?.summary;
    rawSummary = typeof rankSummary === "string" ? rankSummary : "";

    if (!rawSummary || wordCount(rawSummary) === 0) {
      const freqObj = summarizer.getSummaryByFrequency();
      const freqSummary = (freqObj as any)?.summary;
      rawSummary = typeof freqSummary === "string" ? freqSummary : "";
    }

    // If output is still too short, try once with more sentences.
    if (wordCount(rawSummary) > 0 && wordCount(rawSummary) < Math.min(45, maxWords - 10)) {
      summarizer = new SummarizerManager(text, Math.min(sentenceCount + 2, 7));
      const rankObj2 = await summarizer.getSummaryByRank();
      const rankSummary2 = (rankObj2 as any)?.summary;
      const candidate = typeof rankSummary2 === "string" ? rankSummary2 : "";
      if (wordCount(candidate) > wordCount(rawSummary)) {
        rawSummary = candidate;
      }
    }
  } catch {
    rawSummary = "";
  }

  // Fallback: if TextRank yields nothing, use lead sentences.
  if (!rawSummary || wordCount(rawSummary) === 0) {
    rawSummary = takeLeadSentences(text, sentenceCount);
  }

  return finalizeSummary(rawSummary, maxWords);
}

export async function getExtractiveSummary(params: {
  url: string;
  maxWords?: number;
  sentenceCount?: number;
  bypassCache?: boolean;
}): Promise<ExtractiveSummaryResult | null> {
  const { url, maxWords = 60, sentenceCount = 5, bypassCache = false } = params;
  if (!isSafePublicHttpUrl(url)) return null;

  const cacheKey = `${SUMMARY_CACHE_VERSION}:${url}|w=${maxWords}|s=${sentenceCount}`;
  const cached = summaryCache.get(cacheKey);
  const now = Date.now();
  if (!bypassCache && cached && now - cached.fetchedAt < SUMMARY_TTL_MS) {
    return cached.value;
  }

  const extracted = await extractReadableArticle(url);
  if (!extracted) return null;

  // If article is very short, just use excerpt/text without TextRank.
  const cleanedArticleText = cleanTextForSummarization(extracted.text);
  const wc = wordCount(cleanedArticleText);
  const baseText = cleanedArticleText || extracted.excerpt || extracted.text || "";

  const { summary, summaryWordCount } =
    wc < 80
      ? finalizeSummary(baseText, maxWords)
      : await summarizeExtractiveText({ text: baseText, sentenceCount, maxWords });

  // Final fallback: if we still couldn't produce anything, use excerpt.
  const final =
    summary && summaryWordCount > 0
      ? { summary, summaryWordCount }
      : (() => {
          const fallbackBase = extracted.excerpt || baseText;
          return finalizeSummary(fallbackBase, maxWords);
        })();

  const value: ExtractiveSummaryResult = {
    ...extracted,
    sourceUrl: url,
    summary: final.summary,
    summaryWordCount: final.summaryWordCount,
    method: "readability+textrank",
  };

  summaryCache.set(cacheKey, { fetchedAt: now, value });
  return value;
}

