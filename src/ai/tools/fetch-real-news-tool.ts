'use server';
/**
 * @fileOverview A Genkit tool to fetch real news articles from GNews API.
 *
 * - fetchRealNewsArticlesTool - Fetches articles based on keywords.
 * - FetchRealNewsArticlesToolInput - Input type for the tool.
 * - FetchRealNewsArticlesToolOutput - Output type for the tool.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const FetchRealNewsArticlesToolInputSchema = z.object({
  keywords: z.string().describe('Keywords or a phrase to search for news articles.'),
  numberOfArticles: z.number().min(1).max(20).default(15).describe('The number of news articles to fetch.'),
});

export type FetchRealNewsArticlesToolInput = z.infer<typeof FetchRealNewsArticlesToolInputSchema>;

const NewsArticleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  source: z.string(),
  url: z.string(),
  imageUrl: z.string().url().optional().nullable(),
  publishedDate: z.string(),
});

const FetchRealNewsArticlesToolOutputSchema = z.object({
  articles: z.array(NewsArticleSchema),
  timestamp: z.string(),
});

export const fetchRealNewsArticlesTool = ai.defineTool(
  {
    name: 'fetchRealNewsArticlesTool',
    description: 'Fetches real news articles from GNews API based on keywords.',
    inputSchema: FetchRealNewsArticlesToolInputSchema,
    outputSchema: FetchRealNewsArticlesToolOutputSchema,
  },
  async (input: FetchRealNewsArticlesToolInput) => {
    const API_KEY = process.env.GNEWS_API_KEY;
    
    if (!API_KEY) {
      throw new Error('GNEWS_API_KEY is not configured in environment variables. Please add it to your .env.local file.');
    }

    // Base query for AI and technology news, always present in the tool
    let mainFocusQuery = 'AI OR "Artificial Intelligence" OR Technology OR "Computer Science" OR "Latest AI Updates"';
    let finalKeywords = input.keywords ? `(${input.keywords}) AND (${mainFocusQuery})` : mainFocusQuery;

    const params = new URLSearchParams({
      token: API_KEY,
      lang: 'en',
      max: input.numberOfArticles.toString(),
      q: finalKeywords, // Use the combined finalKeywords
    });

    // Note: This tool does not handle specific GNews 'topic' parameters directly,
    // as the main API route handles category mapping more broadly. Keywords are sufficient.

    const gnewsUrl = `https://gnews.io/api/v4/search?${params.toString()}`;
    console.log('Fetching news from GNews (tool):', gnewsUrl);

    try {
      const response = await fetch(gnewsUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error('GNews API request failed response (tool):', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
          url: response.url
        });
        throw new Error(`GNews API request failed (tool): ${errorBody.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Received GNews API response (tool):', {
        status: response.status,
        totalArticles: data.totalArticles,
        articleCount: data.articles?.length,
        firstArticleDate: data.articles?.[0]?.publishedAt
      });

      if (!data.articles || !Array.isArray(data.articles)) {
        console.error('Invalid response from GNews API (tool):', data);
        throw new Error('Invalid response from GNews API (tool)');
      }

      const articles = (data.articles || []).map((article: any) => ({
        title: article.title,
        summary: article.description,
        source: article.source.name,
        url: article.url,
        imageUrl: article.image || null,
        publishedDate: article.publishedAt,
      }));

      return { 
        articles,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error fetching news from GNews API (tool):', error);
      throw new Error(`Failed to fetch news from GNews API (tool): ${error.message}`);
    }
  }
);
