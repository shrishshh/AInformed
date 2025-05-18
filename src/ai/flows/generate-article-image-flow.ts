
// This file is no longer needed and is deprecated.
// Images are now sourced directly from NewsAPI via the fetchRealNewsArticlesTool
// and processed in the generateNewsFeedFlow.

'use server';
/**
 * @fileOverview DEPRECATED: Generates an image for a news article.
 * This flow is no longer used as images are sourced from NewsAPI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleImageInputSchema_DEPRECATED = z.object({
  title: z.string().describe('The title of the news article.'),
  summary: z.string().describe('The summary of the news article.'),
});
export type GenerateArticleImageInput_DEPRECATED = z.infer<typeof GenerateArticleImageInputSchema_DEPRECATED>;

const GenerateArticleImageOutputSchema_DEPRECATED = z.object({
  imageDataUri: z.string().describe(
    "The generated image as a data URI (e.g., 'data:image/png;base64,<encoded_data>')."
  ),
});
export type GenerateArticleImageOutput_DEPRECATED = z.infer<typeof GenerateArticleImageOutputSchema_DEPRECATED>;

export async function generateArticleImage_DEPRECATED(input: GenerateArticleImageInput_DEPRECATED): Promise<GenerateArticleImageOutput_DEPRECATED> {
  console.warn("DEPRECATED: generateArticleImage flow was called. Images are now sourced from NewsAPI.");
  // Return a placeholder or throw an error to indicate deprecation
  return { imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }; // Empty pixel
}

// To fully remove, delete this file and update any imports (e.g., in src/ai/dev.ts and src/app/page.tsx).
// For now, it's left as deprecated to avoid breaking potential old references during transition.
export {}; // Ensures it's treated as a module
