import { NextResponse } from 'next/server';
import { fetchAllRSSFeeds, convertRSSToNewsFormat } from '@/lib/rssFetcher';

export async function GET() {
  try {
    console.log('Testing RSS feeds with HTML entity decoding...');
    const rssArticles = await fetchAllRSSFeeds();
    const formattedArticles = convertRSSToNewsFormat(rssArticles);
    
    // Find articles with HTML entities to show before/after
    const articlesWithEntities = formattedArticles.filter(article => 
      article.title.includes('&#') || article.description.includes('&#')
    );
    
    const articlesWithoutEntities = formattedArticles.filter(article => 
      !article.title.includes('&#') && !article.description.includes('&#')
    );
    
    return NextResponse.json({
      success: true,
      totalArticles: rssArticles.length,
      articlesWithHtmlEntities: articlesWithEntities.length,
      articlesWithoutHtmlEntities: articlesWithoutEntities.length,
      sampleArticlesWithEntities: articlesWithEntities.slice(0, 3),
      sampleArticlesWithoutEntities: articlesWithoutEntities.slice(0, 3),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HTML decode test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 