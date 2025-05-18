
import { config } from 'dotenv';
config(); // Ensures .env variables are loaded

import '@/ai/flows/summarize-article.ts';
import '@/ai/flows/generate-news-feed.ts';
// The generate-article-image-flow.ts is removed as NewsAPI provides images.
// The fetch-real-news-tool.ts is used by generate-news-feed.ts, so it's implicitly included.

// Genkit automatically discovers tools defined with ai.defineTool and associated with flows.
// No need to explicitly import tools here unless they are standalone and not used by a flow.
