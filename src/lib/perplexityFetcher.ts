// Perplexity Fetcher for AI News
// This module fetches articles from Perplexity API and formats them to match your existing news structure

interface PerplexityArticle {
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  primaryCategory?: string;
  secondaryCategories?: string[];
}

interface PerplexityResponse {
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    date?: string;
    last_updated?: string;
  }>;
}

// Perplexity API configuration
const PERPLEXITY_CONFIG = {
  baseUrl: 'https://api.perplexity.ai/search',
  apiKey: process.env.PERPLEXITY_API_KEY,
  maxResults: 15, // Limit results to stay within API limits
  searchRecencyFilter: 'week', // Get news from the past week
  country: 'US', // Country code for results
};

// Category groups for AI news queries (similar to Tavily structure)
export const PERPLEXITY_GROUP_QUERIES: Record<string, { query: string; categories: string[] }> = {
  'Core AI': {
    query: 'latest artificial intelligence news OR AI news OR generative AI OR AI model OR AI ethics OR ethical AI OR AI bias OR responsible AI OR AI governance',
    categories: ['Artificial Intelligence', 'AI Ethics']
  },
  'ML Foundation': {
    query: 'latest machine learning news OR ML news OR supervised learning OR unsupervised learning OR data science news OR big data OR data analytics OR predictive analytics',
    categories: ['Machine Learning', 'Data Science', 'Big Data']
  },
  'Deep Learning Stack': {
    query: 'latest deep learning news OR neural networks news OR neural network OR deep neural OR ANN OR artificial neural network',
    categories: ['Deep Learning', 'Neural Networks']
  },
  'NLP & LLMs': {
    query: 'latest natural language processing news OR NLP news OR language model OR LLM news OR GPT news OR BERT OR large language model OR text processing',
    categories: ['Natural Language Processing']
  },
  'Vision & Perception': {
    query: 'latest computer vision news OR image recognition OR object detection OR CV news OR image processing OR visual AI OR image AI',
    categories: ['Computer Vision']
  },
  'Automation & Robotics': {
    query: 'latest robotics news OR robot news OR autonomous robot OR robotic automation OR automation news OR intelligent automation OR AI automation OR process automation',
    categories: ['Robotics', 'Automation']
  },
  'Advanced Topics': {
    query: 'latest quantum computing news OR quantum AI OR quantum machine learning OR qubit OR quantum computer OR cybersecurity news OR AI security OR cyber security OR threat detection',
    categories: ['Quantum Computing', 'Cybersecurity']
  }
};

// Get group query based on hour of day (rotation strategy)
export function getPerplexityGroupForHour(hour?: number): string {
  const currentHour = hour !== undefined ? hour : new Date().getHours();
  const groups = Object.keys(PERPLEXITY_GROUP_QUERIES);
  const groupIndex = currentHour % groups.length;
  return groups[groupIndex];
}

// Infer category from article content and group
function inferCategory(article: { title: string; snippet: string }, groupName: string): { primary: string; secondary: string[] } {
  const text = `${article.title} ${article.snippet}`.toLowerCase();
  const group = PERPLEXITY_GROUP_QUERIES[groupName];
  
  if (!group) {
    return { primary: 'Artificial Intelligence', secondary: [] };
  }

  // Category keyword mapping
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

// Fetch articles from Perplexity API
export async function fetchPerplexityArticles(groupName?: string): Promise<PerplexityArticle[]> {
  if (!PERPLEXITY_CONFIG.apiKey) {
    console.error('PERPLEXITY_API_KEY not configured');
    return [];
  }

  try {
    // Determine group if not provided
    const targetGroup = groupName || getPerplexityGroupForHour();
    const groupConfig = PERPLEXITY_GROUP_QUERIES[targetGroup];
    
    if (!groupConfig) {
      console.error(`Invalid group: ${targetGroup}`);
      return [];
    }

    console.log(`🔍 Fetching Perplexity articles for group: ${targetGroup} (categories: ${groupConfig.categories.join(', ')})`);

    const response = await fetch(PERPLEXITY_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: groupConfig.query,
        max_results: PERPLEXITY_CONFIG.maxResults,
        search_recency_filter: PERPLEXITY_CONFIG.searchRecencyFilter,
        country: PERPLEXITY_CONFIG.country,
      }),
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API request failed: ${response.status} ${response.statusText}`);
      console.error('Response body:', errorText.substring(0, 500));
      
      // Handle rate limiting or authentication errors
      if (response.status === 401 || response.status === 403) {
        console.warn('⚠️ Perplexity API authentication failed - check API key');
      } else if (response.status === 429) {
        console.warn('⚠️ Perplexity API rate limit exceeded');
      }
      
      return [];
    }

    const data: PerplexityResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid response structure from Perplexity API:', data);
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
        let source = 'Perplexity';
        try {
          const urlObj = new URL(article.url);
          source = urlObj.hostname.replace('www.', '');
        } catch (e) {
          // Invalid URL, use default
        }

        // Parse published date (prefer date, fallback to last_updated, then current date)
        let publishedAt = new Date().toISOString();
        if (article.date) {
          try {
            publishedAt = new Date(article.date).toISOString();
          } catch (e) {
            // Invalid date, try last_updated
            if (article.last_updated) {
              try {
                publishedAt = new Date(article.last_updated).toISOString();
              } catch (e2) {
                // Invalid date, use current
              }
            }
          }
        } else if (article.last_updated) {
          try {
            publishedAt = new Date(article.last_updated).toISOString();
          } catch (e) {
            // Invalid date, use current
          }
        }

        // Use snippet as summary
        const summary = article.snippet 
          ? article.snippet.substring(0, 300).replace(/\s+/g, ' ').trim() + (article.snippet.length > 300 ? '...' : '')
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

    console.log(`✅ Perplexity: Fetched ${formattedArticles.length} articles for ${targetGroup}`);
    return formattedArticles;
    
  } catch (error: any) {
    console.error('Error fetching Perplexity articles:', error);
    
    // Don't throw - return empty array to fail gracefully
    return [];
  }
}

// Convert Perplexity articles to match your existing news format
export function convertPerplexityToNewsFormat(perplexityArticles: PerplexityArticle[]): any[] {
  return perplexityArticles.map(article => {
    return {
      title: article.title,
      description: article.summary,
      url: article.url,
      image: '', // Perplexity doesn't provide images - use empty for fallback
      imageUrl: '', // Same as above
      publishedAt: article.publishedAt,
      source: { name: article.source },
      category: article.primaryCategory, // Tag with primary category
      secondaryCategories: article.secondaryCategories || [],
      _isPerplexity: true,
      _perplexityGroup: article.primaryCategory ? 
        Object.keys(PERPLEXITY_GROUP_QUERIES).find(group => 
          PERPLEXITY_GROUP_QUERIES[group].categories.includes(article.primaryCategory!)
        ) : undefined
    };
  });
}

// Filter Perplexity articles by category (if needed)
export function filterPerplexityArticlesByCategory(articles: PerplexityArticle[], category?: string): PerplexityArticle[] {
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

