import { NextResponse } from 'next/server';
import mockNews from '@/data/news.json';

interface MockArticle {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  date: string;
  category: string;
  content: string;
}

// Mock data for fallback
const mockNewsData = {
  articles: [
    {
      title: "OpenAI Announces GPT-5 Development",
      description: "OpenAI has begun development of GPT-5, promising significant improvements in reasoning and safety.",
      content: "OpenAI has officially announced the development of GPT-5, their next-generation language model...",
      url: "https://example.com/gpt5-announcement",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
      publishedAt: new Date().toISOString(),
      source: { name: "AI News" }
    },
    {
      title: "Google DeepMind's New AI Breakthrough",
      description: "DeepMind researchers have developed a new AI system that can solve complex mathematical problems.",
      content: "Google's DeepMind has made a significant breakthrough in AI research...",
      url: "https://example.com/deepmind-math",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
      publishedAt: new Date().toISOString(),
      source: { name: "Tech Daily" }
    },
    {
      title: "Microsoft's AI Copilot Expands to More Applications",
      description: "Microsoft is expanding its AI Copilot integration to more Office applications and services.",
      content: "Microsoft has announced the expansion of its AI Copilot feature...",
      url: "https://example.com/microsoft-copilot",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
      publishedAt: new Date().toISOString(),
      source: { name: "Tech News" }
    }
  ]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  console.log('API Route - Received category:', category);

  const API_KEY = process.env.GNEWS_API_KEY;
  
  if (!API_KEY) {
    console.error('GNEWS_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  // Base query for AI and technology news, always present
  let mainFocusQuery = 'AI OR "Artificial Intelligence" OR Technology OR "Computer Science" OR "Latest AI Updates"';
  let finalQuery = mainFocusQuery;

  // If user provides a search query, it should refine the main focus, not override it.
  if (query) {
    finalQuery = `(${mainFocusQuery}) AND (${query})`; 
  }

  // GNews has a 'topic' parameter for categories. If a specific category is provided,
  // we can use it, but for general AI news, the `q` parameter is more flexible.
  let gnewsTopic = '';
  if (category) {
    const decodedCategory = decodeURIComponent(category as string); // Decode category first
    // If the decoded category contains spaces, enclose it in double quotes for GNews
    const formattedCategory = decodedCategory.includes(' ') ? `\"${decodedCategory}\"` : decodedCategory;

    console.log('API Route - Decoded category:', decodedCategory);
    console.log('API Route - Formatted category for GNews:', formattedCategory);

    // Map generic categories to GNews topics if possible, or include in query
    switch (decodedCategory.toLowerCase()) { // Use decoded category for switch
      case 'artificial intelligence':
      case 'machine learning':
      case 'deep learning':
      case 'natural language processing':
      case 'computer vision':
      case 'robotics':
      case 'data science':
      case 'cybersecurity':
      case 'quantum computing':
      case 'ai ethics':
      case 'neural networks':
      case 'big data':
      case 'automation':
        gnewsTopic = 'technology'; // GNews often groups these under 'technology'
        // If a tech-related category is selected, refine the query further
        finalQuery = `${finalQuery} AND ${formattedCategory}`;
        break;
      case 'business':
        gnewsTopic = 'business';
        finalQuery = `${finalQuery} AND ${formattedCategory}`;
        break;
      // Add more cases for other categories as needed
      default:
        finalQuery = `${finalQuery} AND ${formattedCategory}`;
    }
  }

  console.log('API Route - Final query string before URLSearchParams:', finalQuery);

  try {
    const params = new URLSearchParams({
      token: API_KEY,
      lang: 'en',
      max: '10',
      q: finalQuery, // Use the combined finalQuery
    });

    // Only add topic if a specific one was mapped
    if (gnewsTopic) {
      params.append('topic', gnewsTopic);
    }

    console.log('Fetching news from GNews with params:', params.toString());

    const response = await fetch(
      `https://gnews.io/api/v4/search?${params.toString()}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        next: { revalidate: 0 } // Disable Next.js cache
      }
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GNews API request failed response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: response.url
      });

      // If we hit the rate limit, return mock data
      if (response.status === 403 && errorBody.errors?.[0]?.includes('request limit')) {
        console.log('Rate limit reached, falling back to mock data');
        return NextResponse.json(mockNewsData);
      }

      throw new Error(`GNews API request failed: ${errorBody.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Received GNews API response:', {
      status: response.status,
      totalArticles: data.totalArticles,
      articleCount: data.articles?.length,
      firstArticleDate: data.articles?.[0]?.publishedAt
    });

    if (!data.articles || !Array.isArray(data.articles)) {
      console.error('Invalid response from GNews API:', data);
      throw new Error('Invalid response from GNews API');
    }

    const articles = data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.image,
      publishedAt: article.publishedAt,
      source: { name: article.source.name },
    }));

    return NextResponse.json({ 
      articles,
      _isMockData: false,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Error fetching news in API route:', error);
    // Return mock data on any error
    return NextResponse.json(mockNewsData);
  }
} 