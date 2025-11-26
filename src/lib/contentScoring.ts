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

// STRICTER: Expanded negative keywords (consumer/shopping/marketing)
const negativeKeywords = [
  // Consumer Shopping/Deals
  'black friday', 'cyber monday', 'prime day', 'deal', 'deals', 'discount',
  'sale', 'sales', 'on sale', 'buy now', 'shop', 'shopping', 'purchase',
  'price drop', 'cheap', 'affordable', 'bargain', 'save money',
  
  // Product Reviews
  'product review', 'review', 'reviews', 'unboxing', 'hands-on',
  'first impressions', 'powerbank', 'airpods', 'gadget', 'gadgets',
  'here\'s why', 'here\'s how', 'earned a permanent spot', 'this $',
  'under $', 'worth it', 'worth buying', 'should you buy',
  
  // Marketing
  'marketing', 'advertising', 'promotion', 'sponsored', 'advertisement',
  
  // General
  'politics', 'sports', 'entertainment', 'celebrity', 'gossip', 'weather',
  'food', 'travel', 'fashion', 'beauty', 'movie', 'film', 'music',
  'bollywood', 'hollywood'
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
  
  // STRICTER: Lower base score (was 50, now 30)
  let relevanceScore = 30;
  let aiFocusScore = 0;
  let innovationScore = 0;
  const qualityIndicators: string[] = [];

  // STRICTER: Require exact word matching for keywords
  const highValueMatches = highValueKeywords.filter(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });
  if (highValueMatches.length > 0) {
    relevanceScore += highValueMatches.length * 20; // Increased from 15
    aiFocusScore += highValueMatches.length * 25; // Increased from 20
    innovationScore += highValueMatches.length * 30; // Increased from 25
    qualityIndicators.push(`High-value keywords: ${highValueMatches.length}`);
  }

  // STRICTER: Exact word matching for medium keywords
  const mediumValueMatches = mediumValueKeywords.filter(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });
  if (mediumValueMatches.length > 0) {
    relevanceScore += mediumValueMatches.length * 8; // Increased from 5
    aiFocusScore += mediumValueMatches.length * 15; // Increased from 10
    qualityIndicators.push(`AI keywords found: ${mediumValueMatches.length}`);
  }

  // STRICTER: Harsher penalties for consumer/shopping content
  const negativeMatches = negativeKeywords.filter(keyword => {
    // More flexible matching for consumer content - check if keyword appears anywhere
    return text.includes(keyword.toLowerCase());
  });
  
  // Also check for price patterns
  const hasPricePattern = /\$\d+|\d+\s*dollars?|under\s*\$\d+|drops?\s*to\s*\$\d+|lowest\s*price|record-low/i.test(text);
  
  // Check for deal patterns in title
  const titleHasDealPattern = /\b(deal|deals|sale|discount|black friday|cyber monday)\b/i.test(title.toLowerCase());
  
  if (negativeMatches.length > 0 || hasPricePattern || titleHasDealPattern) {
    relevanceScore = 0; // Set to 0 (will be filtered out by >= 40 threshold)
    aiFocusScore = 0;
    qualityIndicators.push('❌ Consumer/shopping content detected');
  }

  // STRICTER: Only premium AI research sources
  const premiumAISources = [
    'MIT', 'Stanford', 'Google AI', 'OpenAI', 'Anthropic', 'ArXiv',
    'Nature', 'Science', 'IEEE', 'DeepMind', 'Microsoft Research'
  ];
  if (premiumAISources.some(qSource => source.toLowerCase().includes(qSource.toLowerCase()))) {
    relevanceScore += 15; // Increased from 10
    qualityIndicators.push('✅ Premium AI source');
  }

  // STRICTER: Require industry focus indicators
  const hasIndustryFocus = /\b(research|breakthrough|innovation|development|study|paper|algorithm|model|startup|company|funding|enterprise|industry|announcement|launch|release)\b/i.test(text);
  
  if (!hasIndustryFocus && mediumValueMatches.length < 2) {
    relevanceScore -= 10; // Reduced penalty (was 30) - less harsh
  }

  // Innovation indicators (exact match)
  const innovationKeywords = [
    'breakthrough', 'discovery', 'innovation', 'first time',
    'unveiled', 'launched', 'released', 'announced', 'introduced'
  ];
  const hasInnovation = innovationKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });
  if (hasInnovation) {
    innovationScore += 35; // Increased from 30
    qualityIndicators.push('🚀 Innovation content');
  }

  // Research/academic boost (exact match)
  const researchKeywords = ['research', 'study', 'paper', 'arxiv', 'peer review'];
  const hasResearch = researchKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });
  if (hasResearch) {
    relevanceScore += 20; // Increased from 15
    aiFocusScore += 15; // Increased from 10
    qualityIndicators.push('📚 Research content');
  }

  // STRICTER: Require at least one high-value keyword for decent score
  if (highValueMatches.length === 0 && mediumValueMatches.length < 2) {
    relevanceScore -= 20; // Penalty if no strong AI keywords
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
    // LESS STRICT: Require relevanceScore >= 15 (lowered from 20) AND aiFocusScore >= 5 (lowered from 10) AND score > 0 (blocks consumer content)
    .filter(article => 
      article.score.relevanceScore >= 15 && 
      article.score.aiFocusScore >= 5 &&
      article.score.relevanceScore > 0 // Block negative scores (consumer content)
    )
    .sort((a, b) => {
      // Sort by relevance score first, then AI focus score
      if (b.score.relevanceScore !== a.score.relevanceScore) {
        return b.score.relevanceScore - a.score.relevanceScore;
      }
      return b.score.aiFocusScore - a.score.aiFocusScore;
    });
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

