// src/ai/flows/generate-news-feed.ts
'use server';

/**
 * @fileOverview Generates a personalized news feed based on user interests and source reliability.
 *
 * - generateNewsFeed - A function that generates a news feed tailored to user preferences.
 * - GenerateNewsFeedInput - The input type for the generateNewsFeed function.
 * - GenerateNewsFeedOutput - The return type for the generateNewsFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewsFeedInputSchema = z.object({
  keywords: z.array(z.string()).describe('Keywords to filter news articles.'),
  topics: z.array(z.string()).describe('Topics of interest for news articles.'),
  reliabilityScore: z
    .number()
    .min(0)
    .max(1)
    .describe('Minimum reliability score of news sources (0 to 1).'),
  numberOfArticles: z
    .number()
    .min(1)
    .max(10)
    .default(5) // Default to 5 articles
    .describe('The number of news articles to generate in the feed.'),
});

export type GenerateNewsFeedInput = z.infer<typeof GenerateNewsFeedInputSchema>;

const NewsArticleSchema = z.object({
  title: z.string().describe('Title of the news article.'),
  summary: z.string().describe('Brief summary of the news article.'),
  source: z.string().describe('Source of the news article.'),
  url: z.string().url().describe('URL of the news article.'),
  reliabilityScore: z.number().min(0).max(1).describe('Reliability score of the news source.'),
});

const GenerateNewsFeedOutputSchema = z.object({
  articles: z.array(NewsArticleSchema).describe('Array of news articles.'),
});

export type GenerateNewsFeedOutput = z.infer<typeof GenerateNewsFeedOutputSchema>;

export async function generateNewsFeed(input: GenerateNewsFeedInput): Promise<GenerateNewsFeedOutput> {
  return generateNewsFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsFeedPrompt',
  input: {schema: GenerateNewsFeedInputSchema},
  output: {schema: GenerateNewsFeedOutputSchema},
  prompt: `You are an AI-powered news aggregator that provides a personalized news feed based on user interests and source reliability.

  Generate a news feed consisting of {{numberOfArticles}} articles based on the following criteria:

  Keywords: {{keywords}}
  Topics: {{topics}}
  Minimum Reliability Score: {{reliabilityScore}}

  Each article in the feed should include the title, a brief summary, the source, the URL, and the reliability score of the source.

  Ensure that the generated news feed aligns with the specified keywords, topics, and reliability score, so the user can stay informed about what matters most to them from trustworthy sources.

  Output the news feed as a JSON object, structured as an array of news articles, where each article has the following structure:
  {
    "title": "article title",
    "summary": "article summary",
    "source": "article source",
    "url": "article url",
    "reliabilityScore": 0.85
  }
  `,
});

const generateNewsFeedFlow = ai.defineFlow(
  {
    name: 'generateNewsFeedFlow',
    inputSchema: GenerateNewsFeedInputSchema,
    outputSchema: GenerateNewsFeedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
