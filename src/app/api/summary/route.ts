import { queryPerplexity } from "@/lib/perplexity";

export async function POST(req: Request) {
  const { text } = await req.json();

  const prompt = `
You are given the full text of a news article below.

TASK:
- Write a concise summary of the article in exactly 60 words.
- All your responses are displayed on a client-side website. Do NOT engage in any other conversation.
- Do NOT break the fourth wall. Do not mention that you are an AI assistant or that you are generating a summary.
- Do NOT mention sources, citations, search results, or your own limitations.
- Do NOT say you lack access to information.
- Assume the article text is complete and sufficient.
- If you are not able to generate a summary, strictly follow the instructions and return "No summary available".
- Keep all your responses exactly 60 words.
- Do NOT include a mention [60 words].

STYLE:
- Neutral, journalistic tone
- Clear and factual

ARTICLE:
"""
${text}
"""
`;

  const summary = await queryPerplexity(prompt);

  return Response.json({ summary });
}

