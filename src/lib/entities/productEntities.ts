export interface ProductEntity {
  id: string;
  displayName: string;
  aliases: string[];
  company: string;
}

export const PRODUCT_ENTITIES: ProductEntity[] = [
  {
    id: "chatgpt",
    displayName: "ChatGPT",
    company: "OpenAI",
    aliases: ["chatgpt", "gpt", "gpt-4", "gpt-4.1", "gpt-4o", "gpt-5", "openai chat", "chat gpt"],
  },
  {
    id: "gemini",
    displayName: "Gemini",
    company: "Google",
    aliases: ["gemini", "google ai", "bard", "deepmind gemini"],
  },
  {
    id: "claude",
    displayName: "Claude",
    company: "Anthropic",
    aliases: ["claude", "claude 3", "anthropic claude"],
  },
  {
    id: "copilot",
    displayName: "Copilot",
    company: "Microsoft",
    aliases: ["copilot", "github copilot", "microsoft copilot"],
  },
  {
    id: "llama",
    displayName: "LLaMA",
    company: "Meta",
    aliases: ["llama", "llama 2", "llama 3", "meta llama"],
  },
  {
    id: "perplexity",
    displayName: "Perplexity",
    company: "Perplexity",
    aliases: ["perplexity", "perplexity ai", "perplexity pages"],
  },
];

