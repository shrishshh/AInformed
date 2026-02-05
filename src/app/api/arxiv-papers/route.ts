import { NextResponse } from 'next/server';
import xml2js from 'xml2js';

const ARXIV_API_URL =
  'http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=5';

export async function GET() {
  try {
    const response = await fetch(ARXIV_API_URL);
    const xml = await response.text();
    const result = await xml2js.parseStringPromise(xml);
    const entries = result.feed.entry || [];
    const papers = entries.map((entry: any) => {
      const rawSummary = entry.summary?.[0];
      const abstract =
        typeof rawSummary === 'string'
          ? rawSummary.replace(/\n/g, ' ').trim()
          : rawSummary?._ != null
            ? String(rawSummary._).replace(/\n/g, ' ').trim()
            : '';
      return {
        title: entry.title[0].replace(/\n/g, '').trim(),
        authors: entry.author.map((a: any) => a.name[0]).join(', '),
        link: entry.id[0],
        abstract,
      };
    });
    return NextResponse.json(papers);
  } catch (err) {
    console.error('Failed to fetch arXiv:', err);
    return NextResponse.json([], { status: 500 });
  }
} 