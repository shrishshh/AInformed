
import { config } from 'dotenv';
config(); // Ensures .env variables are loaded

import '@/ai/flows/summarize-article.ts';
import '@/ai/flows/generate-news-feed.ts';
// generate-article-image-flow.ts is removed as NewsAPI provides images.
// Tools are typically not registered here directly if defined with ai.defineTool and used by flows.
// Genkit automatically discovers tools associated with flows.
