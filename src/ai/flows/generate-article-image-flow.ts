
// This file is no longer needed as images are sourced from NewsAPI.
// It can be deleted.
// To ensure no build errors if other files still import it temporarily,
// we can leave it empty or with a placeholder. For cleanup, it should be removed.

/*
'use server';
/**
 * @fileOverview Generates an image for a news article using its title and summary.
 * (This flow is deprecated as images are now sourced from NewsAPI)
 */
/*
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleImageInputSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  summary: z.string().describe('The summary of the news article.'),
});
export type GenerateArticleImageInput = z.infer<typeof GenerateArticleImageInputSchema>;

const GenerateArticleImageOutputSchema = z.object({
  imageDataUri: z.string().describe(
    "The generated image as a data URI (e.g., 'data:image/png;base64,<encoded_data>')."
  ),
});
export type GenerateArticleImageOutput = z.infer<typeof GenerateArticleImageOutputSchema>;

export async function generateArticleImage(input: GenerateArticleImageInput): Promise<GenerateArticleImageOutput> {
  console.warn("generateArticleImage flow is deprecated and should not be called. Images are sourced from NewsAPI.");
  // Return a placeholder or throw an error
  return { imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' };
}

const generateArticleImageFlow = ai.defineFlow(
  {
    name: 'generateArticleImageFlow_DEPRECATED', // Renamed to avoid conflicts if accidentally called
    inputSchema: GenerateArticleImageInputSchema,
    outputSchema: GenerateArticleImageOutputSchema,
  },
  async (input) => {
     console.warn("generateArticleImageFlow is deprecated.");
     return { imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' };
  }
);
*/

// Intentionally left mostly empty to signify deprecation.
// Consider deleting this file as part of project cleanup.
export {}; // Add an empty export to make it a module and satisfy TypeScript if needed.
