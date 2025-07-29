import { NextResponse } from 'next/server';
import { fetchAllRSSFeeds, convertRSSToNewsFormat } from '@/lib/rssFetcher';

export async function GET() {
  try {
    console.log('Testing RSS feeds with image extraction...');
    const rssArticles = await fetchAllRSSFeeds();
    const formattedArticles = convertRSSToNewsFormat(rssArticles);
    
    // Filter articles that have images
    const articlesWithImages = formattedArticles.filter(article => 
      article.image && article.image !== '/placeholder.svg'
    );
    
    const articlesWithoutImages = formattedArticles.filter(article => 
      !article.image || article.image === '/placeholder.svg'
    );
    
    return NextResponse.json({
      success: true,
      totalArticles: rssArticles.length,
      articlesWithImages: articlesWithImages.length,
      articlesWithoutImages: articlesWithoutImages.length,
      sampleArticlesWithImages: articlesWithImages.slice(0, 3),
      sampleArticlesWithoutImages: articlesWithoutImages.slice(0, 3),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Image test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 