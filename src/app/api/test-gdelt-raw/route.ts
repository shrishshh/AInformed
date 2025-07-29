import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=AI&mode=ArtList&format=json&timespan=24H&maxRecords=10';
    
    console.log('Testing GDELT API raw response...');
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GDELTBot/1.0)',
      }
    });

    const responseText = await response.text();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 1000),
      isJson: responseText.trim().startsWith('{'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GDELT raw test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 