// Instagram Fetcher for AI News (via n8n webhook)
// This module fetches Instagram posts/reels from content creators and formats them to match your existing news structure

interface InstagramPost {
  caption: string;
  displayUrl: string;
  videoUrl?: string;
  url: string; // Link to post
  timestamp: string | number;
}

interface InstagramCreator {
  username: string;
  fullName: string;
  profilePicUrlHD: string;
  latestPosts: InstagramPost[];
}

interface InstagramResponse extends Array<InstagramCreator> {}

interface InstagramArticle {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  image?: string;
  videoUrl?: string;
  creatorUsername?: string;
  creatorFullName?: string;
  creatorProfilePic?: string;
}

// Instagram API configuration
const INSTAGRAM_CONFIG = {
  webhookUrl: 'https://sidemindlabs.app.n8n.cloud/webhook/instagram-news',
};

// Convert timestamp to ISO date string
function formatTimestamp(timestamp: string | number): string {
  try {
    // If it's already a number (Unix timestamp in seconds or milliseconds)
    if (typeof timestamp === 'number') {
      // Check if it's in seconds (10 digits) or milliseconds (13 digits)
      const date = timestamp < 10000000000 
        ? new Date(timestamp * 1000) // Convert seconds to milliseconds
        : new Date(timestamp);
      return date.toISOString();
    }
    
    // If it's a string, try to parse it
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      // If parsing fails, use current date
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error formatting timestamp:', timestamp, error);
    return new Date().toISOString();
  }
}

// Format Instagram post to article format
function formatInstagramPost(creator: InstagramCreator, post: InstagramPost): InstagramArticle {
  // Use caption as title (truncate if too long)
  let title = post.caption || 'Instagram Post';
  if (title.length > 200) {
    title = title.substring(0, 200) + '...';
  }

  // Use caption as summary (truncate if too long)
  let summary = post.caption || '';
  if (summary.length > 500) {
    summary = summary.substring(0, 500) + '...';
  }

  // Prefer video thumbnail, then display image, then profile pic
  const image = post.videoUrl || post.displayUrl || creator.profilePicUrlHD || '';

  return {
    source: `Instagram: ${creator.fullName || creator.username}`,
    title: title,
    link: post.url,
    pubDate: formatTimestamp(post.timestamp),
    summary: summary,
    image: image,
    videoUrl: post.videoUrl,
    creatorUsername: creator.username,
    creatorFullName: creator.fullName,
    creatorProfilePic: creator.profilePicUrlHD,
  };
}

// Fetch Instagram posts from n8n webhook
export async function fetchInstagramPosts(): Promise<InstagramArticle[]> {
  try {
    console.log(`Fetching Instagram posts from: ${INSTAGRAM_CONFIG.webhookUrl}`);
    
    const response = await fetch(INSTAGRAM_CONFIG.webhookUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AInformedBot/1.0)',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Instagram API request failed: ${response.status} ${response.statusText}`);
      throw new Error(`Instagram API request failed: ${response.status} ${response.statusText}`);
    }

    const data: InstagramResponse = await response.json();

    if (!Array.isArray(data)) {
      console.error('Invalid response structure from Instagram API:', data);
      return [];
    }

    // Flatten all posts from all creators into a single array
    const allArticles: InstagramArticle[] = [];

    for (const creator of data) {
      if (!creator.latestPosts || !Array.isArray(creator.latestPosts)) {
        console.warn(`Creator ${creator.username} has no posts or invalid posts array`);
        continue;
      }

      for (const post of creator.latestPosts) {
        // Validate post has required fields
        if (!post.url || !post.timestamp) {
          console.warn(`Skipping post from ${creator.username}: missing required fields`);
          continue;
        }

        const article = formatInstagramPost(creator, post);
        allArticles.push(article);
      }
    }

    console.log(`Instagram: Fetched ${allArticles.length} posts from ${data.length} creators`);
    return allArticles;
    
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return [];
  }
}

// Convert Instagram articles to match your existing news format
export function convertInstagramToNewsFormat(instagramArticles: InstagramArticle[]): any[] {
  return instagramArticles.map(article => {
    // Use video URL or display image, fallback to empty string
    const image = (article.videoUrl || article.image) && (article.videoUrl || article.image) !== '/placeholder.svg' 
      ? (article.videoUrl || article.image) 
      : '';
    
    return {
      title: article.title,
      description: article.summary,
      url: article.link,
      image: image,
      imageUrl: image,
      publishedAt: article.pubDate,
      source: { name: article.source },
      _isInstagram: true,
      // Additional Instagram-specific metadata
      videoUrl: article.videoUrl,
      creatorUsername: article.creatorUsername,
      creatorFullName: article.creatorFullName,
      creatorProfilePic: article.creatorProfilePic,
      sourceType: 'AGGREGATOR', // Instagram posts are aggregated content
    };
  });
}

// Filter Instagram articles by category (if needed in the future)
export function filterInstagramArticlesByCategory(articles: InstagramArticle[], category?: string): InstagramArticle[] {
  if (!category) return articles;
  
  return articles.filter(article => {
    const articleText = `${article.title} ${article.summary}`.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Basic keyword matching
    return articleText.includes(categoryLower);
  });
}
