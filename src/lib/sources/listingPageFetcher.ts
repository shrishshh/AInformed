type DiscoveredLink = {
  url: string;
  title: string;
};

type ArticleMeta = {
  url: string;
  title: string;
  summary: string;
  pubDate: string; // ISO
};

const LISTING_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours (polite)
const ARTICLE_META_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_DISCOVERED_LINKS = 30; // per listing refresh (polite)
const MAX_META_FETCHES = 20; // per listing refresh (polite)

const listingCache = new Map<string, { fetchedAt: number; links: DiscoveredLink[] }>();
const articleMetaCache = new Map<string, { fetchedAt: number; meta: ArticleMeta }>();

function absolutizeUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
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

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractFirstMatch(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

function extractMetaContent(html: string, propertyOrName: string): string | null {
  const escaped = propertyOrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
  ];
  return extractFirstMatch(html, patterns);
}

function extractTimeDatetime(html: string): string | null {
  return extractFirstMatch(html, [
    /<time[^>]+datetime=["']([^"']+)["'][^>]*>/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
  ]);
}

function extractTitleFromHtml(html: string): string | null {
  const og = extractMetaContent(html, "og:title");
  if (og) return decodeHtml(og);
  const t = extractFirstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
  return t ? decodeHtml(t.replace(/\s+/g, " ")) : null;
}

function extractDescriptionFromHtml(html: string): string | null {
  const og = extractMetaContent(html, "og:description");
  if (og) return decodeHtml(og);
  const desc = extractMetaContent(html, "description");
  return desc ? decodeHtml(desc) : null;
}

function parseListingLinks(html: string, baseUrl: string): DiscoveredLink[] {
  // Very conservative: extract anchors with href and some text
  const links: DiscoveredLink[] = [];
  const anchorRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html))) {
    const href = m[1] || "";
    const inner = m[2] || "";
    const text = decodeHtml(inner.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
    if (!href || !text) continue;
    if (href.startsWith("#")) continue;
    // Skip non-navigational schemes early
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    const url = absolutizeUrl(href, baseUrl);
    if (!isHttpUrl(url)) continue;
    links.push({ url, title: text });
  }

  // De-dupe by URL and keep first seen title
  const seen = new Set<string>();
  const deduped = links.filter((l) => {
    const key = l.url.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.slice(0, MAX_DISCOVERED_LINKS);
}

export async function discoverListingPageArticles(params: {
  sourceId: string;
  listingUrl: string;
  userAgentLabel?: string;
}): Promise<DiscoveredLink[]> {
  const { sourceId, listingUrl } = params;
  const cached = listingCache.get(sourceId);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < LISTING_TTL_MS) {
    return cached.links;
  }

  const res = await fetch(listingUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AInformed/1.0; +https://localhost)",
      Accept: "text/html,application/xhtml+xml",
    },
    // Cache at the Next.js fetch layer too (defense in depth)
    next: { revalidate: Math.floor(LISTING_TTL_MS / 1000) },
  });

  if (!res.ok) {
    return [];
  }

  const html = await res.text();
  const links = parseListingLinks(html, listingUrl);
  listingCache.set(sourceId, { fetchedAt: now, links });
  return links;
}

export async function fetchArticleMeta(url: string, fallbackTitle: string): Promise<ArticleMeta> {
  if (!isHttpUrl(url)) {
    return {
      url,
      title: fallbackTitle,
      summary: "",
      pubDate: new Date().toISOString(),
    };
  }

  const cached = articleMetaCache.get(url);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < ARTICLE_META_TTL_MS) {
    return cached.meta;
  }

  // Some sites (e.g., mistral.ai) can get stuck in redirect loops. We do a controlled 1-hop redirect.
  const doFetch = async (targetUrl: string) =>
    fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AInformed/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      next: { revalidate: Math.floor(ARTICLE_META_TTL_MS / 1000) },
    });

  let res = await doFetch(url);

  // Follow at most one redirect hop
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (loc) {
      const nextUrl = absolutizeUrl(loc, url);
      if (isHttpUrl(nextUrl)) {
        res = await doFetch(nextUrl);
        url = nextUrl;
      }
    }
  }

  // If blocked, still return something usable (link + title)
  if (!res.ok) {
    const meta: ArticleMeta = {
      url,
      title: fallbackTitle,
      summary: "",
      pubDate: new Date().toISOString(),
    };
    articleMetaCache.set(url, { fetchedAt: now, meta });
    return meta;
  }

  const html = await res.text();
  const title = extractTitleFromHtml(html) ?? fallbackTitle;
  const summary = extractDescriptionFromHtml(html) ?? "";

  const published =
    extractMetaContent(html, "article:published_time") ||
    extractMetaContent(html, "og:updated_time") ||
    extractTimeDatetime(html);

  const dt = published ? new Date(published) : new Date();
  const pubDate = Number.isFinite(dt.getTime()) ? dt.toISOString() : new Date().toISOString();

  const meta: ArticleMeta = {
    url,
    title,
    summary,
    pubDate,
  };

  articleMetaCache.set(url, { fetchedAt: now, meta });
  return meta;
}

export async function listingToArticles(params: {
  sourceId: string;
  sourceName: string;
  listingUrl: string;
}): Promise<{ source: string; title: string; link: string; pubDate: string; summary: string }[]> {
  const links = await discoverListingPageArticles({
    sourceId: params.sourceId,
    listingUrl: params.listingUrl,
  });

  const limited = links.slice(0, MAX_META_FETCHES);
  const metas = await Promise.all(
    limited.map((l) => fetchArticleMeta(l.url, l.title)),
  );

  return metas.map((m) => ({
    source: params.sourceName,
    title: m.title,
    link: m.url,
    pubDate: m.pubDate,
    summary: m.summary,
  }));
}

