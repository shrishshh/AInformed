import { NextResponse } from 'next/server';
import xml2js from 'xml2js';

export const runtime = 'nodejs';

const ARXIV_API_URL =
  'https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=5';

export async function GET() {
  try {
    const response = await fetch(ARXIV_API_URL, { next: { revalidate: 60 * 60 } }); // 1 hour
    const xml = await response.text();
    const result = await xml2js.parseStringPromise(xml);
    const entries = result.feed.entry || [];
    const papers = entries.map((entry: any) => ({
      title: entry.title[0].replace(/\n/g, '').trim(),
      authors: entry.author.map((a: any) => a.name[0]).join(', '),
      link: entry.id[0],
      publishedAt: entry.published?.[0] || undefined,
      source: 'arXiv' as const,
    }));
    return NextResponse.json(papers);
  } catch (err) {
    console.error('Failed to fetch arXiv:', err);
    return NextResponse.json([], { status: 500 });
  }
} 