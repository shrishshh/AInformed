
'use server';
/**
 * @fileOverview Generates an image for a news article using its title and summary.
 *
 * - generateArticleImage - A function that handles image generation for an article.
 * - GenerateArticleImageInput - The input type for the generateArticleImage function.
 * - GenerateArticleImageOutput - The return type for the generateArticleImage function.
 */

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
  return generateArticleImageFlow(input);
}

// This flow uses a specific model capable of image generation.
const generateArticleImageFlow = ai.defineFlow(
  {
    name: 'generateArticleImageFlow',
    inputSchema: GenerateArticleImageInputSchema,
    outputSchema: GenerateArticleImageOutputSchema, // The flow itself returns the Zod schema directly
  },
  async (input) => {
    const { media, text } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Explicitly use the image-capable model
      prompt: `Generate a visually appealing and relevant news-style image that would be suitable for a news website article.
               The article title is: "${input.title}"
               The article summary is: "${input.summary}"
               Create a generic but professional news graphic if specific details are hard to visualize. Avoid text in the image unless it's very generic like "NEWS".`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // Must request IMAGE and TEXT
         safetySettings: [ // Added safety settings to be less restrictive for typical news images
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (media?.url) {
      return { imageDataUri: media.url };
    } else {
      // Fallback or error handling if image generation fails
      console.error('Image generation failed for title:', input.title, 'Generated text was:', text);
      // Return a placeholder or throw an error. For now, returning a known placeholder data URI.
      // This is a transparent 1x1 pixel PNG.
      return { imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' };
    }
  }
);
