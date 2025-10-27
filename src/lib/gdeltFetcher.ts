// GDELT Fetcher for AI News
// This module fetches articles from GDELT API and formats them to match your existing news structure

interface GDELTArticle {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  image?: string;
}

interface GDELTResponse {
  articles: Array<{
    title: string;
    url: string;
    seendate: string;
    socialimage?: string;
    domain?: string;
    language?: string;
  }>;
}

// GDELT API configuration - Enhanced query focused on AI innovations
const GDELT_CONFIG = {
  baseUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
  query: '("Artificial Intelligence" OR "Machine Learning" OR "Deep Learning" OR "Neural Networks" OR GPT OR ChatGPT OR OpenAI OR "Large Language Model" OR "Computer Vision")',
  mode: 'ArtList',
  format: 'json',
  timespan: '24H', // Last 24 hours
  maxResults: 50
};

// Build GDELT API URL
function buildGDELTUrl(): string {
  const params = new URLSearchParams({
    query: GDELT_CONFIG.query,
    mode: GDELT_CONFIG.mode,
    format: GDELT_CONFIG.format,
    timespan: GDELT_CONFIG.timespan,
    maxRecords: GDELT_CONFIG.maxResults.toString()
  });
  
  return `${GDELT_CONFIG.baseUrl}?${params.toString()}`;
}

// Clean and format GDELT article data
function formatGDELTArticle(article: any): GDELTArticle {
  // Clean title - remove HTML entities and normalize
  let title = article.title || '';
  title = title.replace(/&amp;/g, '&');
  title = title.replace(/&lt;/g, '<');
  title = title.replace(/&gt;/g, '>');
  title = title.replace(/&quot;/g, '"');
  title = title.replace(/&#39;/g, "'");
  title = title.replace(/&nbsp;/g, ' ');
  
  // Clean and truncate title
  title = title.trim();
  if (title.length > 200) {
    title = title.substring(0, 200) + '...';
  }
  
  // Parse GDELT date format (e.g., "20250728T144500Z")
  let pubDate: string;
  try {
    if (article.seendate) {
      // GDELT format: "20250728T144500Z" -> "2025-07-28T14:45:00Z"
      const seendate = article.seendate;
      if (seendate && seendate.length >= 15) {
        const year = seendate.substring(0, 4);
        const month = seendate.substring(4, 6);
        const day = seendate.substring(6, 8);
        const time = seendate.substring(9, 15); // "144500"
        const hour = time.substring(0, 2);
        const minute = time.substring(2, 4);
        const second = time.substring(4, 6);
        
        // Construct ISO date string
        const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        pubDate = new Date(isoDate).toISOString();
      } else {
        pubDate = new Date().toISOString();
      }
    } else {
      pubDate = new Date().toISOString();
    }
  } catch (error) {
    console.warn('Failed to parse GDELT date:', article.seendate, 'Using current date');
    pubDate = new Date().toISOString();
  }
  
  // Generate summary from title if no description
  const summary = title.length > 100 ? title.substring(0, 100) + '...' : title;
  
  return {
    source: 'GDELT',
    title,
    link: article.url || '',
    pubDate,
    summary,
    image: article.socialimage || undefined
  };
}

// Fetch articles from GDELT API
export async function fetchGDELTArticles(): Promise<GDELTArticle[]> {
  try {
    const url = buildGDELTUrl();
    console.log(`Fetching GDELT articles from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GDELTBot/1.0)',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GDELT API request failed: ${response.status} ${response.statusText}`);
      console.error('Response body:', errorText.substring(0, 500));
      throw new Error(`GDELT API request failed: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    
    // Debug: Log the first 500 characters of the response
    console.log('GDELT API response preview:', responseText.substring(0, 500));
    
    // Check if response is valid JSON
    if (!responseText.trim().startsWith('{')) {
      console.error('GDELT API returned non-JSON response:', responseText.substring(0, 1000));
      return [];
    }

    let data: GDELTResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GDELT JSON response:', parseError);
      console.error('Response text:', responseText.substring(0, 1000));
      return [];
    }
    
    if (!data.articles || !Array.isArray(data.articles)) {
      console.error('Invalid response structure from GDELT API:', data);
      return [];
    }

    // Filter and format articles
    const formattedArticles = data.articles
      .filter(article => 
        article.title && 
        article.url && 
        article.title.length > 10 // Filter out very short titles
      )
      .map(formatGDELTArticle);

    console.log(`GDELT: Fetched ${formattedArticles.length} articles`);
    return formattedArticles;
    
  } catch (error) {
    console.error('Error fetching GDELT articles:', error);
    return [];
  }
}

// Alternative GDELT fetch using different endpoint
export async function fetchGDELTArticlesAlternative(): Promise<GDELTArticle[]> {
  try {
    // Try a simpler query first
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=(AI)&mode=ArtList&format=json&timespan=24H&maxRecords=20';
    console.log(`Fetching GDELT articles (alternative) from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GDELTBot/1.0)',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`GDELT alternative API request failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const responseText = await response.text();
    console.log('GDELT alternative API response preview:', responseText.substring(0, 500));
    
    if (!responseText.trim().startsWith('{')) {
      console.error('GDELT alternative API returned non-JSON response');
      return [];
    }

    const data = JSON.parse(responseText);
    
    if (!data.articles || !Array.isArray(data.articles)) {
      console.error('Invalid response structure from GDELT alternative API');
      return [];
    }

    const formattedArticles = data.articles
      .filter((article: any) => 
        article.title && 
        article.url && 
        article.title.length > 10
      )
      .map(formatGDELTArticle);

    console.log(`GDELT alternative: Fetched ${formattedArticles.length} articles`);
    return formattedArticles;
    
  } catch (error) {
    console.error('Error fetching GDELT articles (alternative):', error);
    return [];
  }
}

// Convert GDELT articles to match your existing news format
export function convertGDELTToNewsFormat(gdeltArticles: GDELTArticle[]): any[] {
  return gdeltArticles.map(article => ({
    title: article.title,
    description: article.summary,
    url: article.link,
    image: article.image || '/placeholder.svg',
    publishedAt: article.pubDate,
    source: { name: article.source },
    _isGDELT: true
  }));
}

// Filter GDELT articles by category (if needed)
export function filterGDELTArticlesByCategory(articles: GDELTArticle[], category?: string): GDELTArticle[] {
  if (!category) return articles;
  
  return articles.filter(article => {
    const articleText = `${article.title} ${article.summary}`.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Enhanced keyword matching for categories with specific AI focus
    const categoryKeywords: Record<string, string[]> = {
      'artificial intelligence': ['artificial intelligence', 'ai', 'neural network', 'deep learning', 
                                  'machine learning', 'gpt', 'llm', 'chatgpt', 'openai', 
                                  'generative ai', 'ai model', 'ai system'],
      'machine learning': ['machine learning', 'ml', 'deep learning', 'neural network', 
                          'training', 'model', 'algorithm', 'supervised learning', 
                          'unsupervised learning', 'reinforcement learning'],
      'data science': ['data science', 'big data', 'analytics', 'data analysis', 
                       'data mining', 'machine learning model', 'predictive analytics', 
                       'statistical modeling', 'data analytics'],
      'cybersecurity': ['cybersecurity', 'cyber security', 'ai security', 'ai-powered security', 
                        'ml security', 'adversarial machine learning', 'ai threat detection', 
                        'security ai', 'fraud detection ai'],
      'robotics': ['robotics', 'robot', 'autonomous', 'self-driving', 'autonomous vehicle', 
                   'robotic automation', 'ai robots', 'machine learning robotics', 
                   'intelligent automation', 'autonomous system'],
      'natural language processing': ['nlp', 'natural language processing', 'language model', 
                                      'text processing', 'speech recognition', 'chatbot', 
                                      'ai assistant', 'nlu', 'natural language understanding'],
      'computer vision': ['computer vision', 'image recognition', 'cv', 'image processing', 
                         'visual ai', 'image ai', 'object detection', 'face recognition'],
      'quantum computing': ['quantum computing', 'quantum ai', 'quantum machine learning', 
                           'quantum computer', 'qubit'],
      'technology': ['innovation', 'tech breakthrough', 'new technology', 'cutting edge'],
      'business': ['ai startup', 'ai company', 'tech company', 'ai funding', 'ai investment'],
      'research': ['ai research', 'ai breakthrough', 'research paper', 'academic research', 'ai study']
    };
    
    const keywords = categoryKeywords[categoryLower] || [categoryLower];
    return keywords.some(keyword => articleText.includes(keyword));
  });
} 