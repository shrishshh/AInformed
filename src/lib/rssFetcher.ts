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

// RSS feeds focused on AI and technology (updated with premium AI sources)
const feeds: RSSFeed[] = [
  // Premium AI Research & Innovation Sources (Verified Working)
  // DeepMind Blog RSS feed is no longer available (404 error)
  // { name: 'DeepMind Blog', url: 'https://www.deepmind.com/blog/feed/basic', category: 'ai' },
  { name: 'Microsoft Research', url: 'https://www.microsoft.com/en-us/research/feed/', category: 'research' },
  { name: 'NVIDIA AI', url: 'https://blogs.nvidia.com/feed/', category: 'ai' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', category: 'ai' },
  { name: 'The Gradient', url: 'https://thegradient.pub/rss/', category: 'research' },
  { name: 'KDnuggets', url: 'https://www.kdnuggets.com/feed', category: 'data-science' },
  { name: 'OpenAI', url: 'https://openai.com/blog/rss.xml', category: 'ai' },
  // DeepLearning.AI RSS feed is no longer available (404 error)
  // { name: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/the-batch/feed/', category: 'ai' },
  // Stability AI RSS feed is no longer available (404 error)
  // { name: 'Stability AI', url: 'https://stability.ai/blog/rss.xml', category: 'ai' },
  // Google AI Blog RSS feed is no longer available (404 error)
  // { name: 'Google AI Blog', url: 'https://ai.googleblog.com/feeds/posts/default', category: 'ai' },
  
  // Mainstream Tech News (High Quality)
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
  let imageUrl: string | undefined;
  
  // 1. Look for media:content (standard RSS media)
  const mediaContentMatch = item.match(/<media:content[^>]+url="([^"]+)"/i);
  if (mediaContentMatch) {
    imageUrl = mediaContentMatch[1];
  }
  
  // 2. Look for media:thumbnail
  if (!imageUrl) {
    const mediaThumbMatch = item.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
    if (mediaThumbMatch) {
      imageUrl = mediaThumbMatch[1];
    }
  }
  
  // 3. Look for og:image meta tag
  if (!imageUrl) {
    const ogImageMatch = item.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
    }
  }
  
  // 4. Look for image tag in content:encoded
  if (!imageUrl) {
    const contentEncodedMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
    if (contentEncodedMatch) {
      const content = contentEncodedMatch[1];
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }
  }
  
  // 5. Look for image tag in description
  if (!imageUrl) {
    const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    if (descMatch) {
      const description = descMatch[1];
      const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }
  }
  
  // 6. Look for enclosure (RSS standard)
  if (!imageUrl) {
    const enclosureMatch = item.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image[^"]*"/i);
    if (enclosureMatch) {
      imageUrl = enclosureMatch[1];
    }
  }
  
  // Decode HTML entities in the image URL before returning
  if (imageUrl) {
    return decodeHtmlEntities(imageUrl);
  }
  
  return undefined;
}

// Generate AI-themed placeholder images based on source
function generatePlaceholderImage(source: string): string {
  const sourceLower = source.toLowerCase();
  
  // Premium AI Research Labs & Companies
  if (sourceLower.includes('openai')) {
    return 'https://images.unsplash.com/photo-1634117623694-c79e48b3bfa1?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('google ai') || sourceLower.includes('deepmind')) {
    return 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('meta ai')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4d18e10?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('microsoft research')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('nvidia') || sourceLower.includes('gpu')) {
    return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('hugging face') || sourceLower.includes('papers with code')) {
    return 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('gradient') || sourceLower.includes('research')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80';
  }
  
  if (sourceLower.includes('kdnuggets') || sourceLower.includes('data science')) {
    return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80';
  }
  
  // Mainstream Tech News
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
      // Silently skip 403/404 errors (blocked or unavailable feeds)
      if (response.status === 403 || response.status === 404) {
        console.log(`Skipping RSS feed ${url}: HTTP ${response.status} (feed may be blocked or unavailable)`);
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    return parseXMLItems(text);
  } catch (error) {
    // Only log as error if it's not a 403/404
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('403') || errorMessage.includes('404')) {
      console.log(`Skipping RSS feed ${url}: ${errorMessage}`);
    } else {
      console.error(`Error fetching RSS feed ${url}:`, error);
    }
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

  // Enhanced, more inclusive AI/tech filtering with source-based pass
  const strictAIKeywords = [
    // Core AI Terms
    'artificial intelligence', 'ai', 'machine learning', 'deep learning', 'neural network', 'neural networks',
    'computer vision', 'nlp', 'natural language processing', 'gpt', 'llm', 'large language model', 'transformer',
    'reinforcement learning', 'unsupervised learning', 'supervised learning', 'multimodal', 'agent', 'agents',
    'prompt', 'rag', 'retrieval augmented generation', 'vector database', 'embedding', 'fine-tuning', 'lora',
    'diffusion', 'stable diffusion', 'midjourney', 'openai', 'chatgpt', 'claude', 'gemini', 'anthropic', 'hugging face',
    'cerebras', 'graphcore', 'nvidia', 'gpu', 'semiconductor', 'ai chip', 'inference', 'training', 'optimizer',
    'research', 'breakthrough', 'paper', 'arxiv', 'study', 'benchmark', 'sota', 'state of the art', 'evaluation',
    
    // AI Companies & Products
    'perplexity', 'x ai', 'dalle', 'grok', 'bard',
    
    // AI Technologies
    'attention mechanism', 'transfer learning', 'generative ai', 'gen ai',
    'diffusion model', 'variational autoencoder', 'gan', 'generative adversarial network',
    'transformer model', 'encoder-decoder', 'backpropagation',
    
    // AI Frameworks & Tools
    'tensorflow', 'pytorch', 'keras', 'transformers library', 'jax',
    'scikit-learn', 'opencv', 'spacy', 'nltk', 'langchain', 'llamaindex',
    
    // AI Research & Innovation
    'ai research', 'ai breakthrough', 'new ai', 'ai development', 'ai innovation',
    'ai model', 'ai system', 'ai tool', 'ai application',
    
    // Data Science (AI-related)
    'data science', 'big data', 'analytics', 'data analysis', 'machine learning model',
    
    // Cybersecurity (AI-focused)
    'ai security', 'cyber security ai', 'ai-powered security', 'ml security',
    'adversarial machine learning', 'ai threat detection',
    
    // Robotics (AI-focused)
    'robotics', 'autonomous', 'self-driving', 'autonomous vehicles', 'robotic process automation',
    'ai robots', 'machine learning robotics', 'intelligent automation',
    
    // Emerging Technologies
    'quantum computing', 'quantum ai', 'quantum machine learning',
    'edge ai', 'tiny ml', 'federated learning', 'distributed ai',
    
    // Hardware (AI-focused)
    'tpu', 'neural processing unit', 'amd ai',
    
    // Industry Applications
    'ai healthcare', 'ai diagnosis', 'ai medicine', 'ai drug discovery',
    'ai finance', 'ai trading', 'algorithmic trading',
    'ai education', 'ai tutoring', 'personalized learning',
    
    // Latest Trends
    'ai agent', 'autonomous agent', 'ai assistant', 'ai chatbot',
    'prompt engineering', 'model training', 'ai deployment',
    
    // NEW: Broader Tech Keywords (to catch more relevant tech news)
    'software', 'hardware', 'technology', 'tech', 'innovation', 'startup', 'startups',
    'silicon valley', 'tech company', 'tech companies', 'software development', 'programming',
    'algorithm', 'algorithms', 'computing', 'cloud computing', 'cloud', 'saas', 'paas', 'iaas',
    'api', 'apis', 'platform', 'platforms', 'developer', 'developers', 'coding', 'code',
    'app', 'application', 'applications', 'software engineering', 'engineering',
    'digital transformation', 'automation', 'automated', 'smart', 'intelligent',
    'tech news', 'tech industry', 'tech sector', 'tech market', 'tech investment',
    'venture capital', 'vc', 'funding', 'series a', 'series b', 'ipo', 'acquisition',
    'microsoft', 'google', 'apple', 'amazon', 'meta', 'facebook', 'tesla', 'spacex',
    'netflix', 'uber', 'airbnb', 'stripe', 'palantir', 'databricks', 'snowflake',
    'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'web3', 'defi', 'nft',
    'iot', 'internet of things', '5g', '6g', 'wireless', 'telecommunications',
    'cybersecurity', 'cyber security', 'security', 'privacy', 'data privacy',
    'augmented reality', 'ar', 'virtual reality', 'vr', 'metaverse', 'mixed reality',
    'biotechnology', 'biotech', 'genomics', 'precision medicine', 'digital health',
    'fintech', 'financial technology', 'insurtech', 'regtech',
    'edtech', 'education technology', 'healthtech', 'health technology',
    'cleantech', 'green technology', 'renewable energy', 'solar', 'wind power',
    'space technology', 'satellite', 'satellites', 'aerospace', 'rocket', 'spacex',
    'electric vehicle', 'ev', 'electric vehicles', 'battery', 'batteries', 'lithium',
    'semiconductor', 'semiconductors', 'chip', 'chips', 'processor', 'processors',
    'artificial', 'intelligent', 'smart system', 'smart systems', 'automation',
    'tech breakthrough', 'technological', 'technological advancement', 'innovation',
  ];

  // Lighter exclusions to avoid hiding valid articles
  const exclusionKeywords = [
    'general politics', 'sports', 'entertainment', 'celebrities', 'fashion', 'gossip'
  ];

  // Known AI-focused sources for source-based pass (expanded)
  const knownAISources = [
    'Microsoft Research', 'NVIDIA', 'Hugging Face', 'The Gradient', 'KDnuggets',
    'MIT Tech Review', 'Wired', 'Ars Technica', 'TechCrunch', 'VentureBeat', 'OpenAI',
    'EleutherAI', 'Microsoft', 'Google', 'Apple', 'Amazon', 'Meta', 'Tesla',
    'TechRadar', 'ZDNet', 'The Verge', 'Engadget', 'Gizmodo'
  ];

  function isRelevantAIArticle(article: RSSArticle) {
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const sourceName = article.source || '';

    // Check for AI keywords (relaxed - partial matching)
    const hasAIKeyword = strictAIKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      // Exact match or partial match (keyword appears as whole word or part of word)
      return text.includes(keywordLower) || 
             text.split(/\s+/).some(word => word.includes(keywordLower) || keywordLower.includes(word));
    });

    // Check for exclusion keywords (strict - must be exact match to avoid false positives)
    const hasExclusionKeyword = exclusionKeywords.some(keyword =>
      text.includes(keyword.toLowerCase())
    );

    // Check if source is a known AI/tech source
    const isAISource = knownAISources.some(s =>
      sourceName.toLowerCase().includes(s.toLowerCase())
    );

    // RELAXED: Accept if has AI keyword OR trusted AI source, and not an exclusion keyword
    // Also accept if title/summary contains tech-related terms even without exact keyword match
    const hasTechIndicators = /\b(tech|technology|software|hardware|innovation|startup|digital|automation|computing|algorithm|platform|developer|coding|app|application)\b/i.test(text);
    
    return (hasAIKeyword || isAISource || hasTechIndicators) && !hasExclusionKeyword;
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

// Convert RSS articles to match your existing news format
export function convertRSSToNewsFormat(rssArticles: RSSArticle[]): any[] {
  return rssArticles.map(article => {
    // Don't use '/placeholder.svg' - use empty string to let NewsCard handle fallback
    // This ensures we don't trigger the fallback logic unnecessarily
    const image = article.image && article.image !== '/placeholder.svg' ? article.image : '';
    return {
      title: article.title,
      description: article.summary,
      url: article.link,
      image: image, // Use empty string instead of placeholder
      imageUrl: image, // Also set imageUrl for consistency
      publishedAt: article.pubDate,
      source: { name: article.source },
      _isRSS: true
    };
  });
} 