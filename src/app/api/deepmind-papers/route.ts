import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export const runtime = 'nodejs';

type DeepMindPaper = {
  title: string;
  authors: string;
  link: string;
  publishedAt?: string;
  source: 'DeepMind';
};

const LIST_URL = 'https://deepmind.google/research/publications/';
const LIMIT = 5;

function parseDateFromText(text: string): string | undefined {
  // Supports:
  // - "January 9, 2026"
  // - "9 January 2026"
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return undefined;

  const m1 = t.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/
  );
  const m2 = t.match(
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/
  );
  const match = m1?.[0] || m2?.[0];
  if (!match) return undefined;

  const d = new Date(match);
  if (!Number.isFinite(d.getTime())) return undefined;
  return d.toISOString();
}

function normalizeUrl(href: string): string | null {
  const h = (href || '').trim();
  if (!h) return null;
  if (h.startsWith('http://') || h.startsWith('https://')) return h;
  if (h.startsWith('/')) return `https://deepmind.google${h}`;
  return null;
}

function isPublicationDetailUrl(url: string): boolean {
  // We only want: /research/publications/<digits>/
  // Not pagination: /research/publications/page/2/
  return /\/research\/publications\/\d+\/?$/.test(url);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      // Some sites return different markup without a UA.
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html',
    },
    next: { revalidate: 60 * 60 }, // 1 hour
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  return await res.text();
}

function extractAuthorsFromDoc(doc: Document): string {
  const headings = Array.from(doc.querySelectorAll('h2, h3'));
  const authorsHeading = headings.find(
    (h) => (h.textContent || '').trim().toLowerCase() === 'authors'
  );
  if (!authorsHeading) return '';

  // Often the authors appear in the next element (paragraph/list).
  const next = authorsHeading.nextElementSibling;
  return (next?.textContent || '').replace(/\s+/g, ' ').trim();
}

function extractExternalLinkFromDoc(doc: Document): string | null {
  const anchors = Array.from(doc.querySelectorAll('a'));
  const viewPub = anchors.find(
    (a) => (a.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === 'view publication'
  );
  const href = viewPub?.getAttribute('href') || '';
  return normalizeUrl(href);
}

function extractTitleFromDoc(doc: Document): string {
  return (doc.querySelector('h1')?.textContent || '').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  try {
    const listHtml = await fetchHtml(LIST_URL);
    const listDom = new JSDOM(listHtml);
    const listDoc = listDom.window.document;

    const candidateUrls = Array.from(listDoc.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .map((a) => normalizeUrl(a.getAttribute('href') || ''))
      .filter((u): u is string => !!u)
      .filter(isPublicationDetailUrl);

    const uniqueDetailUrls = Array.from(new Set(candidateUrls)).slice(0, LIMIT);

    const settled = await Promise.allSettled(
      uniqueDetailUrls.map(async (detailUrl) => {
        const html = await fetchHtml(detailUrl);
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const title = extractTitleFromDoc(doc);
        const authors = extractAuthorsFromDoc(doc);
        const publishedAt = parseDateFromText(doc.body.textContent || '');
        const externalLink = extractExternalLinkFromDoc(doc);

        const paper: DeepMindPaper = {
          title,
          authors,
          link: externalLink || detailUrl,
          publishedAt,
          source: 'DeepMind',
        };

        // Basic sanity check: avoid returning empty items.
        if (!paper.title || !paper.link) return null;
        return paper;
      })
    );

    const papers = settled
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter((p): p is DeepMindPaper => !!p);

    return NextResponse.json(papers);
  } catch (err) {
    console.error('Failed to fetch DeepMind publications:', err);
    return NextResponse.json([], { status: 500 });
  }
}
