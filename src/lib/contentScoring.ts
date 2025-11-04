// Content Scoring System for AI/Tech News
// This module provides relevance scoring to rank articles by quality and AI/tech focus

export interface ContentScore {
  relevanceScore: number; // Overall relevance (0-100)
  aiFocusScore: number; // Specific AI focus (0-100)
  innovationScore: number; // Innovation/new development (0-100)
  qualityIndicators: string[]; // What factors contribute to the score
}

// High-value AI/Tech keywords (contribute more to score)
const highValueKeywords = [
  'breakthrough', 'innovation', 'new ai', 'ai development', 'ai research',
  'chatgpt', 'openai', 'gpt-4', 'gpt-5', 'claude', 'gemini', 'bard',
  'generative ai', 'transformer', 'llm', 'large language model',
  'reinforcement learning', 'unsupervised learning',
  'computer vision', 'natural language processing', 'machine learning model',
  'ai startup', 'ai funding', 'ai investment', 'ai acquisition',
  'research paper', 'arxiv', 'peer review', 'scientific study',
  'neural network', 'deep learning breakthrough', 'new algorithm'
];

// Medium-value AI keywords
const mediumValueKeywords = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'data science', 'analytics', 'big data', 'robotics', 'autonomous',
  'cybersecurity', 'quantum computing', 'edge ai', 'federated learning'
];

// Low/negative indicators (reduce score)
const negativeKeywords = [
  'politics', 'sports', 'entertainment', 'celebrity', 'gossip', 'weather',
  'food', 'travel', 'fashion', 'beauty', 'entertainment news', 'trivia',
  'opinion piece', 'rumor', 'unverified', 'speculation',
  'bollywood', 'hollywood', 'movie', 'film', 'actor', 'actress',
  'cinema', 'theater', 'music', 'song', 'album', 'concert',
  'celebrity news', 'showbiz', 'entertainment industry'
];

/**
 * Calculate content relevance score for an article
 */
export function calculateContentScore(
  title: string,
  description: string,
  source: string,
  category?: string
): ContentScore {
  const text = `${title} ${description}`.toLowerCase();
  
  let relevanceScore = 50; // Start with base score
  let aiFocusScore = 0;
  let innovationScore = 0;
  const qualityIndicators: string[] = [];

  // Check for high-value keywords (add significant points)
  const highValueMatches = highValueKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
  if (highValueMatches.length > 0) {
    relevanceScore += highValueMatches.length * 15;
    aiFocusScore += highValueMatches.length * 20;
    innovationScore += highValueMatches.length * 25;
    qualityIndicators.push(`High-value keywords: ${highValueMatches.length}`);
  }

  // Check for medium-value keywords (add moderate points)
  const mediumValueMatches = mediumValueKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
  if (mediumValueMatches.length > 0) {
    relevanceScore += mediumValueMatches.length * 5;
    aiFocusScore += mediumValueMatches.length * 10;
    qualityIndicators.push(`AI keywords found: ${mediumValueMatches.length}`);
  }

  // Check for negative keywords (reduce score significantly)
  const negativeMatches = negativeKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
  if (negativeMatches.length > 0) {
    relevanceScore -= negativeMatches.length * 30;
    qualityIndicators.push('⚠️ Non-AI content detected');
  }

  // Source quality boost
  const qualitySources = [
    'MIT', 'Stanford', 'Google', 'OpenAI', 'Anthropic', 'ArXiv',
    'Nature', 'Science', 'IEEE', 'TechCrunch', 'VentureBeat'
  ];
  if (qualitySources.some(qSource => source.toLowerCase().includes(qSource.toLowerCase()))) {
    relevanceScore += 10;
    qualityIndicators.push('✅ High-quality source');
  }

  // Innovation indicators
  const innovationKeywords = [
    'new', 'breakthrough', 'discovery', 'innovation', 'first time',
    'unveiled', 'launched', 'released', 'announced', 'introduced'
  ];
  const hasInnovation = innovationKeywords.some(keyword => text.includes(keyword));
  if (hasInnovation) {
    innovationScore += 30;
    qualityIndicators.push('🚀 Innovation content');
  }

  // Research/academic boost
  if (text.includes('research') || text.includes('study') || text.includes('paper')) {
    relevanceScore += 15;
    aiFocusScore += 10;
    qualityIndicators.push('📚 Research content');
  }

  // Ensure scores are within bounds
  relevanceScore = Math.max(0, Math.min(100, relevanceScore));
  aiFocusScore = Math.max(0, Math.min(100, aiFocusScore));
  innovationScore = Math.max(0, Math.min(100, innovationScore));

  return {
    relevanceScore,
    aiFocusScore,
    innovationScore,
    qualityIndicators
  };
}

/**
 * Score and sort articles by relevance
 */
export function scoreAndSortArticles<T extends { title: string; description?: string; source?: any }>(
  articles: T[]
): (T & { score: ContentScore })[] {
  return articles
    .map(article => ({
      ...article,
      score: calculateContentScore(
        article.title,
        article.description || '',
        article.source?.name || 'Unknown',
        article.category || ''
      )
    }))
    .filter(article => article.score.relevanceScore >= 30) // Filter out low-quality content (relaxed)
    .sort((a, b) => b.score.relevanceScore - a.score.relevanceScore); // Sort by relevance
}

/**
 * Get quality badge based on score
 */
export function getQualityBadge(score: number): string {
  if (score >= 80) return '⭐ High Quality';
  if (score >= 60) return '✓ Good Quality';
  if (score >= 40) return '◯ Fair Quality';
  return '⚠️ Low Relevance';
}

