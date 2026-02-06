import { queryPerplexity } from "@/lib/perplexity";

export async function POST(req: Request) {
  const body = await req.json();
  const text = body?.text ?? body?.abstract ?? "";

  if (!text || typeof text !== "string") {
    return Response.json(
      { error: "Missing or invalid text/abstract" },
      { status: 400 }
    );
  }

  const prompt = `
You are given the abstract of an academic research paper below.

TASK:
- Write a concise, plain-language summary of the paper in exactly 60 words.
- All your responses are displayed on a client-side website. Do NOT engage in any other conversation.
- Do NOT break the fourth wall. Do not mention that you are an AI assistant or that you are generating a summary.
- Do NOT mention sources, citations, search results, or your own limitations.
- Assume the abstract is complete and sufficient.
- If you are not able to generate a summary, strictly return "No summary available".
- Keep your response exactly 60 words.
- Do NOT include a mention like [60 words].

STYLE:
- Neutral, accessible tone suitable for researchers and general readers
- Clear and factual; avoid unnecessary jargon

ABSTRACT:
"""
${text}
"""
`;

  const summary = await queryPerplexity(prompt);

  return Response.json({ summary });
}
