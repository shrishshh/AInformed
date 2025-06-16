import { NextResponse } from 'next/navigation';
import newsData from '@/data/news.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q');

  let filtered = newsData;
  if (category) {
    filtered = filtered.filter(article => article.category.toLowerCase() === category.toLowerCase());
  }
  if (q) {
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(q.toLowerCase()) ||
      article.summary.toLowerCase().includes(q.toLowerCase())
    );
  }
  return NextResponse.json(filtered);
} 