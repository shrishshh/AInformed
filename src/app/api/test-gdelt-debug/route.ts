import { NextResponse } from 'next/server';
import { fetchGDELTArticles, fetchGDELTArticlesAlternative } from '@/lib/gdeltFetcher';

export async function GET() {
  try {
    console.log('Testing both GDELT methods...');
    
    // Test main method
    let mainResult = 'Failed';
    let mainArticles = 0;
    try {
      const mainArticlesData = await fetchGDELTArticles();
      mainArticles = mainArticlesData.length;
      mainResult = 'Success';
    } catch (error) {
      mainResult = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    // Test alternative method
    let altResult = 'Failed';
    let altArticles = 0;
    try {
      const altArticlesData = await fetchGDELTArticlesAlternative();
      altArticles = altArticlesData.length;
      altResult = 'Success';
    } catch (error) {
      altResult = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({
      success: true,
      mainMethod: {
        result: mainResult,
        articles: mainArticles
      },
      alternativeMethod: {
        result: altResult,
        articles: altArticles
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GDELT debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 