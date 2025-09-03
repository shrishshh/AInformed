// RSS Fetcher for AI News (Server-side)
// This module fetches articles from multiple RSS feeds and formats them to match your existing news structure

interface RSSArticle {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  image?: string;
}

interface RSSFeed {
  name: string;
  url: string;
  category?: string;
}

// RSS feeds focused on AI and technology (updated with more reliable sources)
const feeds: RSSFeed[] = [
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', category: 'technology' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'technology' },
  { name: 'Ars Technica', url: 'http://feeds.arstechnica.com/arstechnica/index/', category: 'technology' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/tag/ai/feed/', category: 'ai' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', category: 'ai' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technology' },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'technology' },
  { name: 'Gizmodo', url: 'https://gizmodo.com/rss', category: 'technology' },
  { name: 'TechRadar', url: 'https://www.techradar.com/rss', category: 'technology' },
  { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', category: 'technology' },
];

// Enhanced content cleaner function
function cleanXmlContent(text: string): string {
  if (!text) return '';
  
  let cleanedText = text;
  
  // Remove CDATA sections
  cleanedText = cleanedText.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  
  // Remove XML tags
  cleanedText = cleanedText.replace(/<[^>]*>/g, '');
  
  // Remove common XML artifacts
  cleanedText = cleanedText.replace(/\]\]>/g, ''); // Remove CDATA closing tags
  cleanedText = cleanedText.replace(/<!\[CDATA\[/gi, ''); // Remove CDATA opening tags
  
  // Remove other common XML artifacts
  cleanedText = cleanedText.replace(/&nbsp;/g, ' ');
  cleanedText = cleanedText.replace(/&amp;/g, '&');
  cleanedText = cleanedText.replace(/&lt;/g, '<');
  cleanedText = cleanedText.replace(/&gt;/g, '>');
  cleanedText = cleanedText.replace(/&quot;/g, '"');
  cleanedText = cleanedText.replace(/&#39;/g, "'");
  
  // Remove extra whitespace and normalize
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
}

// HTML entity decoder function
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  // First clean XML content
  let decodedText = cleanXmlContent(text);
  
  // Common HTML entities mapping
  const htmlEntities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#8216;': "'", // Left single quotation mark
    '&#8217;': "'", // Right single quotation mark
    '&#8220;': '"', // Left double quotation mark
    '&#8221;': '"', // Right double quotation mark
    '&#8211;': '–', // En dash
    '&#8212;': '—', // Em dash
    '&#8230;': '…', // Horizontal ellipsis
    '&nbsp;': ' ',
    '&apos;': "'",
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
  };

  // Replace HTML entities with their decoded values
  for (const [entity, replacement] of Object.entries(htmlEntities)) {
    decodedText = decodedText.replace(new RegExp(entity, 'g'), replacement);
  }

  // Also handle numeric HTML entities (&#8216;, &#8217;, etc.)
  decodedText = decodedText.replace(/&#(\d+);/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });

  // Handle hex entities (&#x8216;, &#x8217;, etc.)
  decodedText = decodedText.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });

  return decodedText;
}

// Enhanced image extraction function
function extractImageFromRSSItem(item: string): string | undefined {
  // Try multiple image extraction methods
  
  // 1. Look for media:content (standard RSS media)
  const mediaContentMatch = item.match(/<media:content[^>]+url="([^"]+)"/i);
  if (mediaContentMatch) {
    return mediaContentMatch[1];
  }
  
  // 2. Look for media:thumbnail
  const mediaThumbMatch = item.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
  if (mediaThumbMatch) {
    return mediaThumbMatch[1];
  }
  
  // 3. Look for og:image meta tag
  const ogImageMatch = item.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
  if (ogImageMatch) {
    return ogImageMatch[1];
  }
  
  // 4. Look for image tag in content:encoded
  const contentEncodedMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
  if (contentEncodedMatch) {
    const content = contentEncodedMatch[1];
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }
  
  // 5. Look for image tag in description
  const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
  if (descMatch) {
    const description = descMatch[1];
    const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }
  
  // 6. Look for enclosure (RSS standard)
  const enclosureMatch = item.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image[^"]*"/i);
  if (enclosureMatch) {
    return enclosureMatch[1];
  }
  
  return undefined;
}

// Generate AI-themed placeholder images based on source
function generatePlaceholderImage(source: string): string {
  const sourceLower = source.toLowerCase();
  
  // AI-themed images for different sources
  if (sourceLower.includes('techcrunch') || sourceLower.includes('venturebeat')) {
    return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('wired') || sourceLower.includes('ars technica')) {
    return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('mit') || sourceLower.includes('tech review')) {
    return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('verge') || sourceLower.includes('engadget')) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=600&q=80';
  }
  
  // Default AI/tech image
  return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80';
}

// Simple XML parser using regex (no external dependencies)
function parseXMLItems(xmlText: string): RSSArticle[] {
  const articles: RSSArticle[] = [];
  
  // Extract items using regex
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const items = xmlText.match(itemRegex);
  
  if (!items) return articles;
  
  items.forEach(item => {
    // Extract title
    const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
    
    // Extract link
    const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const link = linkMatch ? linkMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Extract pubDate
    const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const pubDate = pubDateMatch ? pubDateMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Extract description
    const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const description = descMatch ? decodeHtmlEntities(descMatch[1]) : '';
    
    // Extract content:encoded
    const contentMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
    const content = contentMatch ? decodeHtmlEntities(contentMatch[1]) : '';
    
    // Enhanced image extraction
    const image = extractImageFromRSSItem(item);
    
    // Use content if available, otherwise description
    const summary = content || description;
    
    if (title && link) {
      articles.push({
        source: 'RSS',
        title,
        link,
        pubDate: pubDate || new Date().toISOString(),
        summary: summary ? summary.substring(0, 200) + '...' : '',
        image
      });
    }
  });
  
  return articles;
}

// Fetch RSS feed
async function parseRSSFeed(url: string): Promise<RSSArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSBot/1.0)',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    return parseXMLItems(text);
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

// Fetch all RSS feeds
export async function fetchAllRSSFeeds(): Promise<RSSArticle[]> {
  const allArticles: RSSArticle[] = [];

  for (const feed of feeds) {
    try {
      console.log(`Fetching RSS feed: ${feed.name}`);
      const articles = await parseRSSFeed(feed.url);
      
      // Add source name to each article and generate placeholder images
      const articlesWithSource = articles.map((article: RSSArticle) => ({
        ...article,
        source: feed.name,
        // Use extracted image or generate placeholder based on source
        image: article.image || generatePlaceholderImage(feed.name)
      }));
      
      allArticles.push(...articlesWithSource);
      console.log(`Fetched ${articles.length} articles from ${feed.name}`);
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error);
    }
  }

  // Stricter AI/tech filtering
  const aiTechKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'computer vision',
    'nlp', 'natural language', 'gpt', 'llm', 'openai', 'chatgpt', 'data science', 'robotics', 'automation',
    'cloud', 'cyber', 'quantum', 'algorithm', 'software', 'hardware', 'developer', 'programming', 'code',
    'research', 'startup', 'tech', 'technology', 'computing', 'data', 'big data', 'analytics', 'api', 'arxiv',
    'tensorflow', 'pytorch', 'transformer', 'vision', 'speech', 'autonomous', 'self-driving', 'gpu', 'semiconductor',
    'chip', 'internet', 'web', 'blockchain', 'crypto', 'security', 'privacy', 'cloud', 'edge', 'iot', 'virtual',
    'augmented', 'metaverse', 'digital', 'platform', 'mobile', 'app', 'app development', 'devops', 'infra', 'infrastructure'
  ];

  function isRelevantAIArticle(article: RSSArticle) {
    const text = `${article.title} ${article.summary}`.toLowerCase();
    return aiTechKeywords.some(keyword => text.includes(keyword));
  }

  // Filter strictly for AI/tech relevance
  const filteredArticles = allArticles.filter(isRelevantAIArticle);

  // Sort by date (newest first)
  filteredArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return filteredArticles;
}

// Filter RSS articles by category
export function filterRSSArticlesByCategory(articles: RSSArticle[], category?: string): RSSArticle[] {
  if (!category) return articles;
  
  return articles.filter(article => {
    const articleText = `${article.title} ${article.summary}`.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Simple keyword matching for categories
    const categoryKeywords: Record<string, string[]> = {
      'artificial intelligence': ['ai', 'artificial intelligence', 'machine learning', 'deep learning'],
      'machine learning': ['machine learning', 'ml', 'neural network', 'algorithm'],
      'technology': ['tech', 'technology', 'software', 'hardware'],
      'business': ['business', 'startup', 'company', 'market'],
      'research': ['research', 'study', 'paper', 'academic']
    };
    
    const keywords = categoryKeywords[categoryLower] || [categoryLower];
    return keywords.some(keyword => articleText.includes(keyword));
  });
}

// Convert RSS articles to match your existing news format
export function convertRSSToNewsFormat(rssArticles: RSSArticle[]): any[] {
  return rssArticles.map(article => ({
    title: article.title,
    description: article.summary,
    url: article.link,
    image: article.image || '/placeholder.svg',
    publishedAt: article.pubDate,
    source: { name: article.source },
    _isRSS: true
  }));
} 