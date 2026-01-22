import { NextResponse } from 'next/server';
import { fetchPerplexityArticles, convertPerplexityToNewsFormat } from '@/lib/perplexityFetcher';

export async function GET() {
  try {
    console.log('Testing Perplexity API...');
    
    // Check if API key is configured
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'PERPLEXITY_API_KEY not configured in environment variables',
        hint: 'Add PERPLEXITY_API_KEY to your .env.local file',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('PERPLEXITY_API_KEY found:', apiKey.substring(0, 10) + '...');
    
    // Test fetching articles
    const perplexityArticles = await fetchPerplexityArticles('Core AI');
    const formattedArticles = convertPerplexityToNewsFormat(perplexityArticles);
    
    return NextResponse.json({
      success: true,
      apiKeyConfigured: true,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      totalArticles: perplexityArticles.length,
      articles: formattedArticles.slice(0, 10), // Return first 10 for testing
      allArticles: formattedArticles, // Return all for debugging
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Perplexity test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

