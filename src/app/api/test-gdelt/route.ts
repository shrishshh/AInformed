import { NextResponse } from 'next/server';
import { fetchGDELTArticles, convertGDELTToNewsFormat } from '@/lib/gdeltFetcher';

export async function GET() {
  try {
    console.log('Testing GDELT API...');
    const gdeltArticles = await fetchGDELTArticles();
    const formattedArticles = convertGDELTToNewsFormat(gdeltArticles);
    
    return NextResponse.json({
      success: true,
      totalArticles: gdeltArticles.length,
      articles: formattedArticles.slice(0, 10), // Return first 10 for testing
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GDELT test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 