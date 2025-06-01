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
  url: z.string().describe('Full URL of the news article.'), // Output from NewsAPI is a URL, string schema here, validation in tool
  imageUrl: z.string().url().optional().nullable().describe('URL of an image for the article, if available.'),
  publishedDate: z.string().describe('Publication date of the article in ISO format.'),
  reliabilityScore: z.number().min(0).max(1).optional().describe('Reliability score of the news source (0 to 1). Not provided by NewsAPI, can be assigned or estimated separately.'),
});

const GenerateNewsFeedOutputSchema = z.object({
  articles: z.array(NewsArticleSchema).describe('Array of news articles.'),
});

export type GenerateNewsFeedOutput = z.infer<typeof GenerateNewsFeedOutputSchema>;

export async function generateNewsFeed(input: GenerateNewsFeedInput): Promise<GenerateNewsFeedOutput> {
  // This function directly calls the flow.
  // The actual logic for fetching news is now within generateNewsFeedFlow, which uses the tool.
  return generateNewsFeedFlow(input);
}

// This flow now uses the fetchRealNewsArticlesTool to get live news.
const generateNewsFeedFlow = ai.defineFlow(
  {
    name: 'generateNewsFeedFlow',
    inputSchema: GenerateNewsFeedInputSchema,
    outputSchema: GenerateNewsFeedOutputSchema,
    // We are explicitly calling the AI model within the flow logic, not relying on tool calling by the LLM.
  },
  async (flowInput: GenerateNewsFeedInput): Promise<GenerateNewsFeedOutput> => {
    // Prepare the input for the fetchRealNewsArticlesTool using the imported TypeScript type
    const toolInput: FetchRealNewsArticlesToolInput = {
        keywords: flowInput.searchQuery || 'AI OR technology', // Use the updated default query here as well
        numberOfArticles: flowInput.numberOfArticles,
    };

    // Directly call the GNews fetching tool.
    const toolResult = await fetchRealNewsArticlesTool(toolInput);

    const relevantArticles = [];

    // Use the AI model to filter the articles for relevance to AI and Technology advancements.
    for (const article of toolResult.articles) {
      try {
        const prompt = `Review the following news article and determine if it is primarily about Artificial Intelligence (AI) or Technology advancements. Respond with ONLY 'YES' if it is relevant, and ONLY 'NO' if it is not.\\n\\nTitle: ${article.title}\\nSummary: ${article.summary}`;
        
        // Use the configured Google AI model (Gemini)
        const response = await ai.generate({
          model: 'gemini-1.5-flash-latest', // Or the specific model configured in genkit/dev.ts
          prompt: prompt,
          config: { temperature: 0 }, // Use low temperature for deterministic filtering
        });

        const modelOutput = response.text.trim().toUpperCase();

        if (modelOutput === 'YES') {
          // Map tool output to flow output schema and add default reliability score
          relevantArticles.push({
      ...article,
            reliabilityScore: article.source ? 0.75 : undefined, // Assign a default score or leave it undefined/null
          });
        }
      } catch (error) {
        console.error(`Error processing article with AI for relevance: ${article.title}`, error);
        // Optionally, include the article if AI filtering fails, or skip it.
        // For now, we'll skip to ensure only confidently relevant articles are included.
      }
    }

    return { articles: relevantArticles };
  }
);
