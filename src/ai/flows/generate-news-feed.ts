
// src/ai/flows/generate-news-feed.ts
'use server';

/**
 * @fileOverview Generates a personalized news feed by fetching articles from NewsAPI.org.
 *
 * - generateNewsFeed - A function that generates a news feed tailored to user preferences.
 * - GenerateNewsFeedInput - The input type for the generateNewsFeed function.
 * - GenerateNewsFeedOutput - The return type for the generateNewsFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Import the tool function and its TypeScript input type
import { fetchRealNewsArticlesTool, type FetchRealNewsArticlesToolInput } from '@/ai/tools/fetch-real-news-tool';

const GenerateNewsFeedInputSchema = z.object({
  searchQuery: z.string().describe('Keywords or a phrase to search for news articles. This will be used as the "q" parameter for NewsAPI.'),
  numberOfArticles: z
    .number()
    .min(1)
    .max(20) // Max 20 for UI consistency, tool can fetch more if needed internally
    .default(15)
    .describe('The number of news articles to generate in the feed.'),
});

export type GenerateNewsFeedInput = z.infer<typeof GenerateNewsFeedInputSchema>;

const NewsArticleSchema = z.object({
  title: z.string().describe('Title of the news article.'),
  summary: z.string().describe('Brief summary of the news article.'),
  source: z.string().describe('Source of the news article (e.g., BBC News, Reuters).'),
  url: z.string().url().describe('Full URL of the news article.'), // Output from NewsAPI is a URL
  imageUrl: z.string().url().optional().nullable().describe('URL of an image for the article, if available.'),
  publishedDate: z.string().describe('Publication date of the article in ISO format.'),
  reliabilityScore: z.number().min(0).max(1).optional().describe('Reliability score of the news source (0 to 1). Not provided by NewsAPI, can be assigned or estimated separately.'),
});

const GenerateNewsFeedOutputSchema = z.object({
  articles: z.array(NewsArticleSchema).describe('Array of news articles.'),
});

export type GenerateNewsFeedOutput = z.infer<typeof GenerateNewsFeedOutputSchema>;

export async function generateNewsFeed(input: GenerateNewsFeedInput): Promise<GenerateNewsFeedOutput> {
  return generateNewsFeedFlow(input);
}

// This flow now uses the fetchRealNewsArticlesTool to get live news.
const generateNewsFeedFlow = ai.defineFlow(
  {
    name: 'generateNewsFeedFlow',
    inputSchema: GenerateNewsFeedInputSchema,
    outputSchema: GenerateNewsFeedOutputSchema,
    tools: [fetchRealNewsArticlesTool], // The tool is provided here for the AI to use
  },
  async (flowInput: GenerateNewsFeedInput): Promise<GenerateNewsFeedOutput> => {
    // Prepare the input for the fetchRealNewsArticlesTool using the imported TypeScript type
    const toolInput: FetchRealNewsArticlesToolInput = {
        keywords: flowInput.searchQuery,
        numberOfArticles: flowInput.numberOfArticles,
    };

    // Directly call the tool.
    // The AI model isn't strictly needed here to "decide" to call the tool,
    // as fetching news is the primary purpose of this flow.
    // If we wanted the AI to, for example, refine the keywords first, then a prompt would be needed.
    const toolResult = await fetchRealNewsArticlesTool(toolInput);

    // Map tool output to flow output schema
    // Assign a default reliability score or leave it undefined
    const articlesWithDefaults = toolResult.articles.map(article => ({
      ...article,
      // id: article.url, // Using URL as ID if needed by frontend; ensure NewsArticle type matches
      reliabilityScore: article.source ? 0.75 : undefined, // Example: Assign a default score
    }));

    return { articles: articlesWithDefaults };
  }
);
