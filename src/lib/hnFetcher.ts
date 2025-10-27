// Hacker News Fetcher for AI/tech stories
// This module fetches trending stories from Hacker News via Algolia API

interface HNStory {
  source: string;
  title: string;
  link: string;
  points: number;
  author: string;
  comments: number;
  pubDate: string;
  image?: string;
  objectID: string;
}

interface HNResponse {
  hits: Array<{
    objectID: string;
    title: string;
    url?: string;
    points: number;
    author: string;
    num_comments: number;
    created_at: string;
    _tags: string[];
  }>;
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
}

// Hacker News API configuration - Enhanced AI-focused query
const HN_CONFIG = {
  baseUrl: 'https://hn.algolia.com/api/v1/search',
  query: '(AI OR "Artificial Intelligence" OR "Machine Learning" OR "Deep Learning" OR "Neural Networks" OR "OpenAI" OR "ChatGPT" OR "GPT" OR "LLM" OR "generative AI" OR "computer vision" OR "NLP" OR "data science" OR "robotics" OR "cybersecurity AI" OR "transformer" OR "reinforcement learning")',
  tags: 'story',
  hitsPerPage: 30,
  // timeRange: 'all' // Algolia API does not support this param
};

// Build Hacker News API URL
function buildHNUrl(): string {
  const params = new URLSearchParams({
    query: HN_CONFIG.query,
    tags: HN_CONFIG.tags,
    hitsPerPage: HN_CONFIG.hitsPerPage.toString()
    // DO NOT include timeRange, Algolia API does not support it
  });
  return `${HN_CONFIG.baseUrl}?${params.toString()}`;
}

// Clean and format Hacker News story data
function formatHNStory(story: any): HNStory {
  // Clean title - remove HTML entities and normalize
  let title = story.title || '';
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
  
  // Determine the link - prefer original URL, fallback to HN discussion
  const link = story.url || `https://news.ycombinator.com/item?id=${story.objectID}`;
  
  // Format date
  const pubDate = story.created_at ? new Date(story.created_at).toISOString() : new Date().toISOString();
  
  return {
    source: 'HackerNews',
    title,
    link,
    points: story.points || 0,
    author: story.author || 'Anonymous',
    comments: story.num_comments || 0,
    pubDate,
    image: '/placeholder.svg', // Use placeholder since HN doesn't provide images
    objectID: story.objectID
  };
}

// Fetch stories from Hacker News API
export async function fetchHNStories(): Promise<HNStory[]> {
  try {
    const url = buildHNUrl();
    console.log(`Fetching Hacker News stories from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HNBot/1.0)',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HN API request failed: ${response.status} ${response.statusText}`);
      console.error('Response body:', errorText.substring(0, 500));
      throw new Error(`HN API request failed: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    
    // Debug: Log the first 500 characters of the response
    console.log('HN API response preview:', responseText.substring(0, 500));
    
    // Check if response is valid JSON
    if (!responseText.trim().startsWith('{')) {
      console.error('HN API returned non-JSON response:', responseText.substring(0, 1000));
      return [];
    }

    let data: HNResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse HN JSON response:', parseError);
      console.error('Response text:', responseText.substring(0, 1000));
      return [];
    }
    
    if (!data.hits || !Array.isArray(data.hits)) {
      console.error('Invalid response structure from HN API:', data);
      return [];
    }

    // Filter and format stories
    const formattedStories = data.hits
      .filter(story => 
        story.title && 
        story.title.length > 10 // Filter out very short titles
        // Removed points filter to allow fresh stories
      )
      .map(formatHNStory);

    console.log(`HN: Fetched ${formattedStories.length} stories`);
    return formattedStories;
    
  } catch (error) {
    console.error('Error fetching HN stories:', error);
    return [];
  }
}

// Alternative HN fetch with different query
export async function fetchHNStoriesAlternative(): Promise<HNStory[]> {
  try {
    // Try a simpler query
    const url = 'https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=20';
    console.log(`Fetching HN stories (alternative) from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HNBot/1.0)',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`HN alternative API request failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const responseText = await response.text();
    console.log('HN alternative API response preview:', responseText.substring(0, 500));
    
    if (!responseText.trim().startsWith('{')) {
      console.error('HN alternative API returned non-JSON response');
      return [];
    }

    const data = JSON.parse(responseText);
    
    if (!data.hits || !Array.isArray(data.hits)) {
      console.error('Invalid response structure from HN alternative API');
      return [];
    }

    const formattedStories = data.hits
      .filter((story: any) => 
        story.title && 
        story.title.length > 10 &&
        story.points > 1
      )
      .map(formatHNStory);

    console.log(`HN alternative: Fetched ${formattedStories.length} stories`);
    return formattedStories;
    
  } catch (error) {
    console.error('Error fetching HN stories (alternative):', error);
    return [];
  }
}

// Convert HN stories to match your existing news format
export function convertHNToNewsFormat(hnStories: HNStory[]): any[] {
  return hnStories.map(story => ({
    title: story.title,
    description: `${story.points} points • ${story.comments} comments • by ${story.author}`,
    url: story.link,
    image: story.image || '/placeholder.svg',
    publishedAt: story.pubDate,
    source: { name: story.source },
    _isHN: true,
    points: story.points,
    comments: story.comments,
    author: story.author
  }));
}

// Filter HN stories by category (if needed)
export function filterHNStoriesByCategory(stories: HNStory[], category?: string): HNStory[] {
  if (!category) return stories;
  
  return stories.filter(story => {
    const storyText = `${story.title}`.toLowerCase();
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
    return keywords.some(keyword => storyText.includes(keyword));
  });
} 