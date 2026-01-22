// RSS Fetcher for AI News (Server-side)
// This module fetches articles from multiple RSS feeds and formats them to match your existing news structure

import { classifyUpdate } from "./classifier/updateClassifier";
import { rankArticles } from "./ranking/articleRanker";
import { tagEntities } from "./entities/entityTagger";
import { OFFICIAL_AI_SOURCES } from "./sources/officialSources";
import { listingToArticles } from "./sources/listingPageFetcher";

interface RSSArticle {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  image?: string;
  // Optional classification of what kind of update this is (if any)
  updateType?: "PRODUCT_UPDATE" | "MODEL_RELEASE" | "API_UPDATE" | "RESEARCH";
  // Optional product/entity tags detected from title/summary (Step 4)
  entities?: string[];
  // Source type (for ranking/filtering)
  sourceType?: string;
}

interface RSSFeed {
  name: string;
  url: string;
  category?: string;
}

// Official sources are fetched via RSS and/or listing page discovery (single source of truth)
const officialSources = OFFICIAL_AI_SOURCES;

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

  for (const src of officialSources) {
    try {
      if (src.fetchMethod === "RSS" && src.rss) {
        console.log(`Fetching RSS feed: ${src.company}`);
        const articles = await parseRSSFeed(src.rss);

        const articlesWithSource = articles.map((article: RSSArticle) => ({
          ...article,
          source: src.company,
          image: article.image || generatePlaceholderImage(src.company),
          sourceType: src.sourceType,
        }));

        allArticles.push(...articlesWithSource);
        console.log(`Fetched ${articles.length} articles from ${src.company}`);
      } else if (src.fetchMethod === "LISTING_PAGE") {
        const listingUrl = src.listingUrl || src.website;
        console.log(`Discovering listing page: ${src.company}`);

        const discovered = await listingToArticles({
          sourceId: src.id,
          sourceName: src.company,
          listingUrl,
        });

        const discoveredAsRss = discovered.map((a) => ({
          source: src.company,
          title: a.title,
          link: a.link,
          pubDate: a.pubDate,
          summary: a.summary ? a.summary.substring(0, 200) + "..." : "",
          image: generatePlaceholderImage(src.company),
          sourceType: src.sourceType,
        })) as RSSArticle[];

        allArticles.push(...discoveredAsRss);
        console.log(`Discovered ${discoveredAsRss.length} articles from ${src.company}`);
      } else {
        // NONE: do nothing
      }
    } catch (error) {
      console.error(`Error fetching ${src.company}:`, error);
    }
  }

  // NEW: Classify updates and drop non-update / fluff posts early
  const classifiedArticles: RSSArticle[] = allArticles.filter((article) => {
    const updateType = classifyUpdate({
      title: article.title,
      url: article.link,
      summary: article.summary,
    });

    if (updateType === "IGNORE") {
      return false;
    }

    // Persist the concrete update type for downstream consumers
    if (updateType !== "IGNORE") {
      article.updateType = updateType === "RESEARCH" ? "RESEARCH" : updateType;
    }

    // Step 4: Tag product/entities after classification
    article.entities = tagEntities({
      title: article.title,
      summary: article.summary,
      source: article.source,
    });

    return true;
  });

  // Official-only RSS feeds: do NOT apply extra AI relevance / consumer filtering here.
  // Classification already removed fluff (IGNORE) and the source registry is the gatekeeper.
  const rankedArticles = rankArticles(classifiedArticles);

  return rankedArticles;
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
      _isRSS: true,
      // Preserve "smart pipeline" fields for downstream ranking/sections/UI
      updateType: article.updateType,
      entities: article.entities,
      _score: (article as any)._score,
      sourceType: article.sourceType,
    };
  });
} 