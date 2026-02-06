// NOTE: Legacy Perplexity-based implementation has been commented out
// to switch to zero-cost extractive summarization.
//
// import { queryPerplexity } from "@/lib/perplexity";
//
// export async function POST(req: Request) {
//   const body = await req.json();
//   const text = body?.text ?? body?.abstract ?? "";
//
//   if (!text || typeof text !== "string") {
//     return Response.json(
//       { error: "Missing or invalid text/abstract" },
//       { status: 400 }
//     );
//   }
//
//   const prompt = `...`;
//   const summary = await queryPerplexity(prompt);
//   return Response.json({ summary });
// }

import { summarizeContent } from "@/lib/summarization/extractiveSummarizer";

export async function POST(req: Request) {
  const body = await req.json();
  const text = (body?.text ?? body?.abstract ?? "") as string;
  const link = typeof body?.link === "string" ? body.link : undefined;

  if ((!text || typeof text !== "string") && !link) {
    return Response.json(
      { error: "Missing paper text/abstract and link" },
      { status: 400 }
    );
  }

  try {
    const result = await summarizeContent("paper", {
      url: link,
      abstract: text,
      maxWords: 60,
    });

    if (!result?.summary) {
      return Response.json({ summary: "No summary available." });
    }

    return Response.json({ summary: result.summary });
  } catch (err) {
    console.error("Error generating paper summary:", err);
    return Response.json({ summary: "No summary available." });
  }
}
