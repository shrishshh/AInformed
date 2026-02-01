// Tavily Fetcher for AI News
// This module fetches articles from Tavily API and formats them to match your existing news structure

interface TavilyArticle {
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  primaryCategory?: string;
  secondaryCategories?: string[];
}

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    published_date?: string;
    score?: number;
  }>;
}

// Tavily API configuration
const TAVILY_CONFIG = {
  baseUrl: 'https://api.tavily.com/search',
  apiKey: process.env.TAVILY_API_KEY,
  maxResults: 10, // Limit results to stay within credit budget
  searchDepth: 'advanced', // Use advanced search for better quality
};

// Category groups for rotation strategy (7 groups covering all 13 categories)
export const TAVILY_GROUP_QUERIES: Record<string, { query: string; categories: string[] }> = {
  'Core AI': {
    query: 'artificial intelligence OR AI OR "generative AI" OR "AI model" OR "AI ethics" OR "ethical AI" OR "AI bias" OR "responsible AI" OR "AI governance"',
    categories: ['Artificial Intelligence', 'AI Ethics']
  },
  'ML Foundation': {
    query: 'machine learning OR ML OR "supervised learning" OR "unsupervised learning" OR "data science" OR "big data" OR "data analytics" OR "predictive analytics"',
    categories: ['Machine Learning', 'Data Science', 'Big Data']
  },
  'Deep Learning Stack': {
    query: 'deep learning OR "neural networks" OR "neural network" OR "deep neural" OR ANN OR "artificial neural network"',
    categories: ['Deep Learning', 'Neural Networks']
  },
  'NLP & LLMs': {
    query: 'natural language processing OR NLP OR "language model" OR LLM OR GPT OR BERT OR "large language model" OR "text processing"',
    categories: ['Natural Language Processing']
  },
  'Vision & Perception': {
    query: 'computer vision OR "image recognition" OR "object detection" OR CV OR "image processing" OR "visual AI" OR "image AI"',
    categories: ['Computer Vision']
  },
  'Automation & Robotics': {
    query: 'robotics OR robot OR "autonomous robot" OR "robotic automation" OR automation OR "intelligent automation" OR "AI automation" OR "process automation"',
    categories: ['Robotics', 'Automation']
  },
  'Advanced Topics': {
    query: 'quantum computing OR "quantum AI" OR "quantum machine learning" OR qubit OR "quantum computer" OR cybersecurity OR "AI security" OR "cyber security" OR "threat detection"',
    categories: ['Quantum Computing', 'Cybersecurity']
  }
};

// Get group query based on hour of day (rotation strategy)
export function getGroupForHour(hour?: number): string {
  const currentHour = hour !== undefined ? hour : new Date().getHours();
  const groups = Object.keys(TAVILY_GROUP_QUERIES);
  const groupIndex = currentHour % groups.length;
  return groups[groupIndex];
}

// Infer category from article content and group
function inferCategory(article: { title: string; content: string }, groupName: string): { primary: string; secondary: string[] } {
  const text = `${article.title} ${article.content}`.toLowerCase();
  const group = TAVILY_GROUP_QUERIES[groupName];
  
  if (!group) {
    return { primary: 'Artificial Intelligence', secondary: [] };
  }

  // Category keyword mapping (from your existing categoryKeywords)
  const categoryKeywords: Record<string, string[]> = {
    'Artificial Intelligence': ['artificial intelligence', 'ai', 'generative ai', 'ai model', 'ai system'],
    'Machine Learning': ['machine learning', 'ml', 'supervised learning', 'unsupervised learning'],
    'Deep Learning': ['deep learning', 'neural network', 'deep neural', 'cnn', 'rnn', 'transformer'],
    'Natural Language Processing': ['natural language processing', 'nlp', 'language model', 'llm', 'gpt', 'bert'],
    'Computer Vision': ['computer vision', 'image recognition', 'object detection', 'cv', 'image processing'],
    'Robotics': ['robotics', 'robot', 'autonomous robot', 'robotic automation'],
    'Data Science': ['data science', 'big data', 'data analytics', 'predictive analytics'],
    'Big Data': ['big data', 'large-scale data', 'data infrastructure', 'data warehousing', 'data lake'],
    'Cybersecurity': ['cybersecurity', 'ai security', 'cyber security', 'threat detection'],
    'Quantum Computing': ['quantum computing', 'quantum ai', 'quantum machine learning', 'qubit'],
    'AI Ethics': ['ai ethics', 'ethical ai', 'ai bias', 'responsible ai', 'ai governance'],
    'Neural Networks': ['neural network', 'neural networks', 'artificial neural network', 'ann'],
    'Automation': ['automation', 'intelligent automation', 'ai automation', 'process automation']
  };

  // Score each category in the group
  const categoryScores: Record<string, number> = {};
  group.categories.forEach(category => {
    const keywords = categoryKeywords[category] || [];
    const score = keywords.reduce((sum, keyword) => {
      const regex = new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return sum + (text.match(regex)?.length || 0);
    }, 0);
    categoryScores[category] = score;
  });

  // Find primary category (highest score)
  const primaryCategory = Object.entries(categoryScores).reduce((a, b) => 
    categoryScores[a[0]] > categoryScores[b[0]] ? a : b
  )[0] || group.categories[0];

  // Find secondary categories (other categories with score > 0)
  const secondaryCategories = Object.entries(categoryScores)
    .filter(([cat, score]) => cat !== primaryCategory && score > 0)
    .map(([cat]) => cat);

  return { primary: primaryCategory, secondary: secondaryCategories };
}

// Fetch articles from Tavily API
export async function fetchTavilyArticles(groupName?: string): Promise<TavilyArticle[]> {
  if (!TAVILY_CONFIG.apiKey) {
    console.error('TAVILY_API_KEY not configured');
    return [];
  }

  try {
    // Determine group if not provided
    const targetGroup = groupName || getGroupForHour();
    const groupConfig = TAVILY_GROUP_QUERIES[targetGroup];
    
    if (!groupConfig) {
      console.error(`Invalid group: ${targetGroup}`);
      return [];
    }

    console.log(`🔍 Fetching Tavily articles for group: ${targetGroup} (categories: ${groupConfig.categories.join(', ')})`);

    const response = await fetch(TAVILY_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_CONFIG.apiKey,
        query: groupConfig.query,
        search_depth: TAVILY_CONFIG.searchDepth,
        max_results: TAVILY_CONFIG.maxResults,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tavily API request failed: ${response.status} ${response.statusText}`);
      console.error('Response body:', errorText.substring(0, 500));
      
      // Handle credit exhaustion
      if (response.status === 402 || response.status === 429) {
        console.warn('⚠️ Tavily credits exhausted or rate limited');
      }
      
      return [];
    }

    const data: TavilyResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid response structure from Tavily API:', data);
      return [];
    }

    // Format and tag articles
    const formattedArticles = data.results
      .filter(article => 
        article.title && 
        article.url && 
        article.title.length > 10 // Filter out very short titles
      )
      .map(article => {
        const { primary, secondary } = inferCategory(article, targetGroup);
        
        // Extract domain from URL for source
        let source = 'Tavily';
        try {
          const urlObj = new URL(article.url);
          source = urlObj.hostname.replace('www.', '');
        } catch (e) {
          // Invalid URL, use default
        }

        // Parse published date
        let publishedAt = new Date().toISOString();
        if (article.published_date) {
          try {
            publishedAt = new Date(article.published_date).toISOString();
          } catch (e) {
            // Invalid date, use current
          }
        }

        // Generate summary from content (first 200 chars)
        const summary = article.content 
          ? article.content.substring(0, 200).replace(/\s+/g, ' ').trim() + (article.content.length > 200 ? '...' : '')
          : article.title.substring(0, 150);

        return {
          source,
          title: article.title.trim(),
          url: article.url,
          publishedAt,
          summary,
          primaryCategory: primary,
          secondaryCategories: secondary,
        };
      });

    console.log(`✅ Tavily: Fetched ${formattedArticles.length} articles for ${targetGroup}`);
    return formattedArticles;
    
  } catch (error: any) {
    console.error('Error fetching Tavily articles:', error);
    
    // Don't throw - return empty array to fail gracefully
    return [];
  }
}

// Search-only: fetch articles for a user-entered query (no caching)
export async function searchTavilyArticles(searchQuery: string): Promise<any[]> {
  if (!TAVILY_CONFIG.apiKey) return [];

  const q = (searchQuery || '').trim();
  if (!q) return [];

  try {
    const response = await fetch(TAVILY_CONFIG.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_CONFIG.apiKey,
        query: q,
        search_depth: TAVILY_CONFIG.searchDepth,
        max_results: 20,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      cache: 'no-store',
    });

    if (!response.ok) return [];
    const data: TavilyResponse = await response.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((r) => r?.title && r?.url)
      .map((r) => {
        let source = 'Tavily';
        try {
          source = new URL(r.url).hostname.replace('www.', '');
        } catch {
          // ignore
        }

        const publishedAt = r.published_date ? new Date(r.published_date).toISOString() : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        const description = (r.content || '').toString().trim().slice(0, 240);

        return {
          title: r.title.trim(),
          description,
          url: r.url,
          image: '',
          imageUrl: '',
          publishedAt,
          source: { name: source },
          _isTavily: true,
          sourceType: 'AGGREGATOR',
        };
      });
  } catch {
    return [];
  }
}

// Convert Tavily articles to match your existing news format
export function convertTavilyToNewsFormat(tavilyArticles: TavilyArticle[]): any[] {
  return tavilyArticles.map(article => {
    return {
      title: article.title,
      description: article.summary,
      url: article.url,
      image: '', // Tavily doesn't provide images - use empty for fallback
      imageUrl: '', // Same as above
      publishedAt: article.publishedAt,
      source: { name: article.source },
      category: article.primaryCategory, // Tag with primary category
      secondaryCategories: article.secondaryCategories || [],
      _isTavily: true,
      _tavilyGroup: article.primaryCategory ? 
        Object.keys(TAVILY_GROUP_QUERIES).find(group => 
          TAVILY_GROUP_QUERIES[group].categories.includes(article.primaryCategory!)
        ) : undefined
    };
  });
}

// Filter Tavily articles by category (if needed)
export function filterTavilyArticlesByCategory(articles: TavilyArticle[], category?: string): TavilyArticle[] {
  if (!category) return articles;
  
  const categoryLower = category.toLowerCase();
  
  return articles.filter(article => {
    // Check primary category
    if (article.primaryCategory?.toLowerCase() === categoryLower) {
      return true;
    }
    
    // Check secondary categories
    if (article.secondaryCategories?.some(cat => cat.toLowerCase() === categoryLower)) {
      return true;
    }
    
    // Fallback: keyword matching
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const categoryKeywords: Record<string, string[]> = {
      'artificial intelligence': ['artificial intelligence', 'ai', 'generative ai', 'ai model'],
      'machine learning': ['machine learning', 'ml', 'supervised learning', 'unsupervised learning'],
      'deep learning': ['deep learning', 'neural network', 'deep neural'],
      'natural language processing': ['natural language processing', 'nlp', 'language model', 'llm'],
      'computer vision': ['computer vision', 'image recognition', 'object detection', 'cv'],
      'robotics': ['robotics', 'robot', 'autonomous robot'],
      'data science': ['data science', 'big data', 'data analytics'],
      'big data': ['big data', 'large-scale data', 'data infrastructure'],
      'cybersecurity': ['cybersecurity', 'ai security', 'cyber security'],
      'quantum computing': ['quantum computing', 'quantum ai', 'qubit'],
      'ai ethics': ['ai ethics', 'ethical ai', 'ai bias', 'responsible ai'],
      'neural networks': ['neural network', 'neural networks', 'artificial neural network'],
      'automation': ['automation', 'intelligent automation', 'ai automation']
    };
    
    const keywords = categoryKeywords[categoryLower] || [categoryLower];
    return keywords.some(keyword => text.includes(keyword));
  });
}

