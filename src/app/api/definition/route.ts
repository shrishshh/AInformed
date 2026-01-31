import { queryPerplexity } from "@/lib/perplexity";

/** Strip markdown code fences so we can parse JSON from model output */
function extractJsonFromResponse(raw: string): string {
  let text = raw.trim();
  // Remove ```json ... ``` or ``` ... ```
  const codeBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }
  return text;
}

/** If a field is accidentally double-encoded JSON, try to get a readable string */
function ensureString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    // If it looks like JSON, try to parse and extract text
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const inner = JSON.parse(trimmed);
        if (typeof inner === "string") return inner;
        if (Array.isArray(inner)) return inner.map(String).join(". ");
        if (typeof inner === "object" && inner !== null && "definition" in inner) return String(inner.definition);
        if (typeof inner === "object" && inner !== null) return JSON.stringify(inner);
      } catch {
        // not valid JSON, return as-is
      }
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(String).join(". ");
  return String(value);
}

function fallbackPayload(normalizedWord: string) {
  return {
    standardDefinition: `Definition for "${normalizedWord}" could not be loaded.`,
    contextualExplanation: "The service is temporarily unavailable. Please try again.",
    examples: [] as string[],
  };
}

export async function POST(req: Request) {
  let normalizedWord = "";
  let context = "";
  try {
    const body = await req.json();
    const word = body?.word ?? body;
    normalizedWord = typeof word === "string" ? word : word?.word ?? "";
    context = (body?.context ?? "").slice(0, 500);
  } catch {
    return Response.json(fallbackPayload(""), { status: 400 });
  }

  try {
    const response = await queryPerplexity(
      `You must respond with ONLY a single JSON object. No markdown, no code fences, no extra text.

Define the term or phrase: "${normalizedWord}".
- For hyphenated or multi-word terms (e.g. "in-context"), define the phrase as a whole.
Provide:
1. standardDefinition: A clear dictionary-style definition (plain text, one or two sentences).
2. contextualExplanation: How this term is used in the following text (plain text): "${context}"
3. examples: An array of exactly 2 short example sentences.

Response must be valid JSON only, with keys: "standardDefinition", "contextualExplanation", "examples".`
    );

    const jsonStr = extractJsonFromResponse(response ?? "");

    let parsed: { standardDefinition?: unknown; contextualExplanation?: unknown; examples?: unknown };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        standardDefinition: response,
        contextualExplanation: `Contextual explanation for "${normalizedWord}" could not be generated.`,
        examples: [],
      };
    }

    const standardDefinition = ensureString(parsed.standardDefinition);
    const contextualExplanation = ensureString(parsed.contextualExplanation);
    const examples = Array.isArray(parsed.examples)
      ? parsed.examples.map((ex) => ensureString(ex)).filter(Boolean)
      : [];

    return Response.json({
      standardDefinition: standardDefinition || `No definition found for "${normalizedWord}".`,
      contextualExplanation: contextualExplanation || `How "${normalizedWord}" is used in this article could not be generated.`,
      examples,
    });
  } catch {
    return Response.json(fallbackPayload(normalizedWord || "word"), { status: 200 });
  }
}
