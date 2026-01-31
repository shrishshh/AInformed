interface PerplexityArticle {
  title: string;
  url: string;
  publishedAt?: string;
  description?: string;
  source?: string;
}

function safeToIsoMaybe(d: any): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return undefined;
  return dt.toISOString();
}

function tryParseJsonArray(text: string): any[] | null {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  // Sometimes the model wraps JSON in ```json ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;

  try {
    const j = JSON.parse(candidate);
    if (Array.isArray(j)) return j;
    if (Array.isArray(j?.articles)) return j.articles;
  } catch {
    // ignore
  }
  return null;
}

export async function searchPerplexityArticles(searchQuery: string): Promise<any[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return [];

  const q = (searchQuery || '').trim();
  if (!q) return [];

  // We ask Perplexity to return a strict JSON array.
  const prompt = [
    `Return a JSON array (no markdown) of up to 20 RECENT news articles about: "${q}".`,
    `Each item MUST have: title, url, publishedAt (ISO if known, else omit), description (1 sentence), source (domain or publisher).`,
    `Only include real news URLs. Do not include courses, tutorials, or shopping/deals.`,
  ].join('\n');

  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a precise news extraction engine.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const arr = tryParseJsonArray(content);
    if (!arr) return [];

    const formatted = arr
      .map((a: PerplexityArticle) => {
        const url = (a?.url || '').toString().trim();
        const title = (a?.title || '').toString().trim();
        if (!url || !title) return null;

        const publishedAt = safeToIsoMaybe(a?.publishedAt) || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        const description = (a?.description || '').toString().trim();
        const source = (a?.source || '').toString().trim() || (() => {
          try {
            return new URL(url).hostname.replace(/^www\./, '');
          } catch {
            return 'Perplexity';
          }
        })();

        return {
          title,
          description,
          url,
          image: '',
          imageUrl: '',
          publishedAt,
          source: { name: source },
          _isPerplexity: true,
          sourceType: 'AGGREGATOR',
        };
      })
      .filter(Boolean) as any[];

    return formatted;
  } catch {
    return [];
  }
}

