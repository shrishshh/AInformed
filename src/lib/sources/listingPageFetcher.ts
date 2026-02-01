// Polite listing-page fetcher:
// - Fetches a "news/blog" listing page
// - Extracts recent article links (no full-page crawling)
// - For each link, fetches minimal metadata (title/description/date/image) from HTML head tags

export interface ListingDiscoveredArticle {
  title: string;
  url: string;
  description?: string;
  publishedAt?: string; // ISO string if available
  image?: string;
}

function normalizeUrlKey(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    url.search = "";
    // Normalize trailing slash (except root)
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return (u || "").trim().replace(/\/+$/, "");
  }
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function stripTags(s: string): string {
  return (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalizeMaybeRelativeUrl(href: string, baseUrl: string): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;

  // Skip non-http schemes early
  if (/^(mailto:|tel:|javascript:|data:)/i.test(trimmed)) return null;

  try {
    const u = new URL(trimmed, baseUrl);
    return u.toString();
  } catch {
    return null;
  }
}

function looksLikeListingOrArchive(url: string, anchorText?: string): boolean {
  const u = url.toLowerCase();
  const t = (anchorText || "").toLowerCase();

  const badFragments = [
    "/tag/",
    "/tags/",
    "/category/",
    "/categories/",
    "/topics/",
    "/topic/",
    "/archive",
    "/archives",
    "/all",
    "/posts",
    "/blog",
    "/news",
    "/press",
    "/press-kit",
    "/presskit",
    "/media-kit",
    "/brand",
    "/about",
    "/careers",
    "/jobs",
    "/contact",
    "/legal",
    "/privacy",
    "/terms",
    "/policy",
    "/security",
    "/press-releases",
    "/research",
    "/research-papers",
  ];

  if (badFragments.some((frag) => u.endsWith(frag) || u.includes(frag + "?") || u.includes(frag + "#"))) {
    // don't hard-block /blog or /news if the URL is clearly an article (has a long slug)
    // we'll keep a softer check below
  }

  const badTitles = ["all posts", "all news", "view all", "see all", "press", "newsroom"];
  if (badTitles.some((x) => t === x)) return true;

  // If URL ends with just /blog or /news or /press, it's a listing
  if (/(\/blog\/?$|\/news\/?$|\/press\/?$|\/updates\/?$)/i.test(u)) return true;

  return false;
}

function extractMeta(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]+)"[^>]*>`, "i");
  const m = html.match(re);
  return m?.[1] ? decodeHtmlEntities(m[1]).trim() : undefined;
}

function extractTitle(html: string): string | undefined {
  const og = extractMeta(html, "og:title");
  if (og) return stripTags(og);
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (m?.[1]) return stripTags(decodeHtmlEntities(m[1]));
  return undefined;
}

function extractDescription(html: string): string | undefined {
  const og = extractMeta(html, "og:description");
  if (og) return stripTags(og);
  const d = extractMeta(html, "description");
  if (d) return stripTags(d);
  return undefined;
}

function extractImage(html: string): string | undefined {
  const og = extractMeta(html, "og:image");
  if (og) return og;
  return undefined;
}

function extractJsonLdPublishedDate(html: string): string | undefined {
  // JSON-LD scripts can be huge; use a conservative regex scan.
  const scripts = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi);
  if (!scripts) return undefined;

  for (const s of scripts) {
    const bodyMatch = s.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const body = bodyMatch?.[1]?.trim();
    if (!body) continue;

    // datePublished or dateCreated
    const m = body.match(/"datePublished"\s*:\s*"([^"]+)"/i) || body.match(/"dateCreated"\s*:\s*"([^"]+)"/i);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

function extractTimeTagDate(html: string): string | undefined {
  const m = html.match(/<time[^>]+datetime="([^"]+)"[^>]*>/i);
  if (m?.[1]) return m[1];
  return undefined;
}

function extractListingDates(
  listingHtml: string,
  listingUrl: string
): Map<string, string> {
  // Many "newsroom" pages show explicit dates in the listing but not on the article pages.
  // This best-effort extractor finds Month DD, YYYY patterns and associates them with the
  // nearest href in the following HTML chunk.
  const out = new Map<string, string>();

  const month =
    "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const dateRe = new RegExp(`${month}\\s+\\d{1,2},\\s+\\d{4}`, "g");

  let m: RegExpExecArray | null;
  while ((m = dateRe.exec(listingHtml))) {
    const dateStr = m[0];
    const start = m.index;
    const window = listingHtml.slice(start, start + 1600);

    // Prefer links to likely article pages. We still validate host below.
    const hrefMatch = window.match(/href="([^"]+)"/i);
    if (!hrefMatch?.[1]) continue;

    const abs = normalizeMaybeRelativeUrl(hrefMatch[1], listingUrl);
    if (!abs) continue;

    // Skip the listing URL itself and obvious non-articles.
    if (normalizeUrlKey(abs) === normalizeUrlKey(listingUrl)) continue;
    if (looksLikeListingOrArchive(abs)) continue;

    const dt = new Date(dateStr);
    if (!Number.isFinite(dt.getTime())) continue;
    out.set(normalizeUrlKey(abs), dt.toISOString());
  }

  return out;
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AInformedBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    // IMPORTANT: Listing pages can be very large (multi-MB) and Next's fetch cache can error.
    // Keep this no-store to avoid "items over 2MB can not be cached" failures.
    cache: "no-store",
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, finalUrl: res.url || url };
}

export async function fetchArticleMeta(url: string): Promise<ListingDiscoveredArticle | null> {
  if (!isHttpUrl(url)) return null;

  try {
    const { ok, status, text, finalUrl } = await fetchText(url);
    if (!ok) {
      // If blocked/failed, still return minimal entry with very old date so it doesn't pollute "Today"
      const now = Date.now();
      return {
        title: finalUrl,
        url: finalUrl,
        description: undefined,
        publishedAt: new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    const title = extractTitle(text) || finalUrl;
    const description = extractDescription(text);
    const image = extractImage(text);

    const publishedRaw =
      extractMeta(text, "article:published_time") ||
      extractMeta(text, "og:updated_time") ||
      extractTimeTagDate(text) ||
      extractJsonLdPublishedDate(text);

    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    let publishedAt: string | undefined;
    if (publishedRaw) {
      const dt = new Date(publishedRaw);
      if (Number.isFinite(dt.getTime()) && dt.getTime() <= oneDayFromNow) {
        publishedAt = dt.toISOString();
      } else {
        // Invalid/future date: push to bottom by making it old
        publishedAt = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
      publishedAt = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    return { title, url: finalUrl, description, image, publishedAt };
  } catch (e) {
    return null;
  }
}

export function parseListingLinks(listingHtml: string, listingUrl: string): Array<{ url: string; text?: string }> {
  const links: Array<{ url: string; text?: string }> = [];
  let baseHost = "";
  try {
    baseHost = new URL(listingUrl).hostname;
  } catch {
    baseHost = "";
  }

  // Very lightweight anchor extraction
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(listingHtml))) {
    const href = m[1];
    const text = stripTags(decodeHtmlEntities(m[2] || ""));
    const abs = normalizeMaybeRelativeUrl(href, listingUrl);
    if (!abs) continue;
    if (!isHttpUrl(abs)) continue;
    // Keep discovery on the same host to avoid drifting into press-kits / external mega pages
    if (baseHost) {
      try {
        const h = new URL(abs).hostname;
        if (h !== baseHost) continue;
      } catch {
        continue;
      }
    }
    if (looksLikeListingOrArchive(abs, text)) continue;
    links.push({ url: abs, text });
  }

  // De-dupe
  const seen = new Set<string>();
  const deduped = links.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });

  return deduped;
}

export async function listingToArticles(listingUrl: string, limit: number = 20): Promise<ListingDiscoveredArticle[]> {
  if (!isHttpUrl(listingUrl)) return [];

  try {
    const { ok, text } = await fetchText(listingUrl);
    if (!ok) return [];

    const links = parseListingLinks(text, listingUrl)
      .filter((l) => normalizeUrlKey(l.url) !== normalizeUrlKey(listingUrl))
      .slice(0, limit);

    // Best-effort: capture published dates from the listing page itself.
    const publishedAtByUrl = extractListingDates(text, listingUrl);

    const metas = await Promise.allSettled(links.map((l) => fetchArticleMeta(l.url)));

    const out: ListingDiscoveredArticle[] = [];
    for (const r of metas) {
      if (r.status === "fulfilled" && r.value) {
        const key = normalizeUrlKey(r.value.url);
        const listingDate = publishedAtByUrl.get(key);
        if (listingDate) {
          r.value.publishedAt = listingDate;
        }
        out.push(r.value);
      }
    }

    return out;
  } catch {
    return [];
  }
}

