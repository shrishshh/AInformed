import { NextResponse } from 'next/server';
import { fetchAllRSSFeeds, convertRSSToNewsFormat } from '@/lib/rssFetcher';

export async function GET() {
  try {
    console.log('Testing RSS feeds...');
    const rssArticles = await fetchAllRSSFeeds();
    const formattedArticles = convertRSSToNewsFormat(rssArticles);
    
    return NextResponse.json({
      success: true,
      totalArticles: rssArticles.length,
      articles: formattedArticles.slice(0, 10), // Return first 10 for testing
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('RSS test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 