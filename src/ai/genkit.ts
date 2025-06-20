/**
 * If you want more flexibility for AI stuff, I would recommend using:
 * https://ai-sdk.dev/docs/introduction
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
