import { NextResponse } from "next/server";
import { getExtractiveSummary } from "@/lib/summarization/extractiveSummarizer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") || "";
  const maxWords = Number(searchParams.get("maxWords") || "60");
  const sentenceCount = Number(searchParams.get("sentences") || "3");
  const refresh = searchParams.get("refresh") === "true";

  if (!url) {
    return NextResponse.json(
      { success: false, error: "Missing required query param: url" },
      { status: 400 },
    );
  }

  const safeMaxWords = Number.isFinite(maxWords) ? Math.min(Math.max(maxWords, 20), 120) : 60;
  const safeSentences = Number.isFinite(sentenceCount)
    ? Math.min(Math.max(sentenceCount, 1), 5)
    : 3;

  try {
    const result = await getExtractiveSummary({
      url,
      maxWords: safeMaxWords,
      sentenceCount: safeSentences,
      bypassCache: refresh,
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not summarize this URL (blocked/invalid/unreadable).",
          sourceUrl: url,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      title: result.title,
      excerpt: result.excerpt,
      summary: result.summary,
      summaryWordCount: result.summaryWordCount,
      sourceUrl: result.sourceUrl,
      meta: {
        siteName: result.siteName || null,
        byline: result.byline || null,
        length: result.length ?? null,
        method: result.method,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Article summary API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        sourceUrl: url,
      },
      { status: 500 },
    );
  }
}

