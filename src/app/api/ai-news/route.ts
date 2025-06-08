import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  const API_KEY = process.env.GNEWS_API_KEY;
  
  if (!API_KEY) {
    console.error('GNEWS_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  let q = query || 'AI OR technology';
  if (category) {
    q = category;
    if (query) {
      q = `${category} ${query}`;
    }
  }

  try {
    const response = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&token=${API_KEY}`
    );

    if (!response.ok) {
      console.error(`GNews API request failed with status ${response.status}`);
      const errorBody = await response.text();
      console.error('GNews API error response body:', errorBody);
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching news in API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
} 