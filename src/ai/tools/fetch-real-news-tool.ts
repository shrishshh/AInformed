'use server';
/**
 * @fileOverview A Genkit tool to fetch real news articles from NewsAPI.org.
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

    const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(input.keywords || 'AI OR technology')}&lang=en&max=${input.numberOfArticles}&token=${API_KEY}`;

    try {
      const response = await fetch(gnewsUrl);

      if (!response.ok) {
        console.error(`GNews API request failed with status ${response.status}`);
        const errorBody = await response.text();
        console.error('GNews API error response body:', errorBody);
        throw new Error(`GNews API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      const articles = (data.articles || []).map((article: any) => ({
        title: article.title,
        summary: article.description,
        source: article.source.name,
        url: article.url,
        imageUrl: article.image || null,
        publishedDate: article.publishedAt,
      }));

      return { articles };
    } catch (error: any) {
      console.error('Error fetching news from GNews:', error);
      throw new Error(`Failed to fetch news from GNews: ${error.message}`);
    }
  }
);
