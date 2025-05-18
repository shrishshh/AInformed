
'use server';
/**
 * @fileOverview A Genkit tool to fetch real news articles from NewsAPI.org.
 *
 * - fetchRealNewsArticlesTool - Fetches articles based on keywords.
 * - FetchRealNewsArticlesToolInput - Input type for the tool.
 * - FetchRealNewsArticlesToolOutput - Output type for the tool.
 */

import {ai} from '@/ai/genkit';
import {z}
from 'genkit';

const NewsApiArticleSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(), // This will be mapped to 'summary'
  url: z.string().url().nullable(),
  urlToImage: z.string().url().nullable(),
  publishedAt: z.string().datetime({ message: "Invalid datetime string" }).nullable(), // ISO 8601 format
  source: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
  }).nullable(),
  // content: z.string().nullable(), // NewsAPI sometimes provides full content, could be used for summarization
});

// Define the Zod schema for the tool's input locally. DO NOT EXPORT THIS CONST.
const FetchRealNewsArticlesToolInputSchemaInternal = z.object({
  keywords: z.string().describe('Keywords or a phrase to search for in articles. Corresponds to the "q" parameter in NewsAPI.'),
  numberOfArticles: z.number().min(1).max(100).default(20).describe('Number of articles to fetch.'),
});
// Export the TypeScript type derived from the schema.
export type FetchRealNewsArticlesToolInput = z.infer<typeof FetchRealNewsArticlesToolInputSchemaInternal>;

// Define the Zod schema for the tool's output locally. DO NOT EXPORT THIS CONST.
const FetchRealNewsArticlesToolOutputSchemaInternal = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      summary: z.string(), // Mapped from description
      source: z.string(), // Mapped from source.name
      url: z.string().url(),
      imageUrl: z.string().url().optional().nullable(), // Mapped from urlToImage
      publishedDate: z.string(), // Mapped from publishedAt (should be ISO string)
    })
  ),
});
// Export the TypeScript type derived from the schema.
export type FetchRealNewsArticlesToolOutput = z.infer<typeof FetchRealNewsArticlesToolOutputSchemaInternal>;

export const fetchRealNewsArticlesTool = ai.defineTool(
  {
    name: 'fetchRealNewsArticlesTool',
    description: 'Fetches live news articles from NewsAPI.org based on keywords.',
    inputSchema: FetchRealNewsArticlesToolInputSchemaInternal, // Use the local schema definition
    outputSchema: FetchRealNewsArticlesToolOutputSchemaInternal, // Use the local schema definition
  },
  async (input: FetchRealNewsArticlesToolInput): Promise<FetchRealNewsArticlesToolOutput> => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error('NEWS_API_KEY environment variable is not set. Please obtain an API key from NewsAPI.org and add it to your .env file.');
    }

    const newsApiUrl = new URL('https://newsapi.org/v2/everything');
    newsApiUrl.searchParams.append('q', input.keywords);
    newsApiUrl.searchParams.append('pageSize', input.numberOfArticles.toString());
    newsApiUrl.searchParams.append('language', 'en'); // Fetch English articles
    newsApiUrl.searchParams.append('sortBy', 'publishedAt'); // Sort by published date for "latest"
    newsApiUrl.searchParams.append('apiKey', apiKey);

    try {
      const response = await fetch(newsApiUrl.toString());
      if (!response.ok) {
        const errorData = await response.json();
        console.error('NewsAPI Error:', errorData);
        throw new Error(`NewsAPI request failed with status ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json() as { articles: z.infer<typeof NewsApiArticleSchema>[] };

      const mappedArticles = data.articles
      .filter(article => article.title && article.url && article.source?.name && article.description && article.publishedAt) // Filter out articles with missing essential fields
      .map(article => ({
        title: article.title!,
        summary: article.description!,
        source: article.source!.name!,
        url: article.url!,
        imageUrl: article.urlToImage,
        publishedDate: article.publishedAt!,
      }));

      return { articles: mappedArticles };
    } catch (error: any) {
      console.error('Error fetching or processing news from NewsAPI:', error);
      // Provide more context in the error message if possible
      const detail = error.cause || error.message || 'Unknown error';
      throw new Error(`Failed to fetch news from NewsAPI: ${detail}`);
    }
  }
);
