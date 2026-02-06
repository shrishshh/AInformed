'use client';

import { useEffect, useState } from 'react';
import { usePaperSummary } from '@/hooks/usePaperSummary';
import { Sparkles } from 'lucide-react';

interface Paper {
  title: string;
  authors: string;
  link: string;
  abstract?: string;
  publishedAt?: string;
  source?: 'arXiv' | 'DeepMind';
}

function ArxivPaperCard({ paper }: { paper: Paper }) {
  const { summary, loading } = usePaperSummary({
    abstract: paper.abstract,
    link: paper.link,
  });

  return (
    <li className="flex flex-col pb-3 border-b border-border last:border-0 last:pb-0">
      <a
        href={paper.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 mb-1"
      >
        {paper.title}
      </a>

      {!!paper.authors && (
        <span className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {paper.authors}
        </span>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Sparkles className="h-3 w-3" />
        <span>60-word AI summary</span>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground italic">
          Generating AI summary…
        </p>
      ) : summary ? (
        <p className="text-xs text-muted-foreground leading-relaxed min-h-[120px]">
          {summary}
        </p>
      ) : null}
    </li>
  );
}

function DeepmindPaperCard({ paper }: { paper: Paper }) {
  const { summary, loading } = usePaperSummary({
    link: paper.link,
  });

  return (
    <li
      className="flex flex-col pb-3 border-b border-border last:border-0 last:pb-0"
    >
      <a
        href={paper.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 mb-1"
      >
        {paper.title}
      </a>

      {!!paper.authors && (
        <span className="text-xs text-muted-foreground line-clamp-1 mb-1">
          {paper.authors}
        </span>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Sparkles className="h-3 w-3" />
        <span>60-word AI summary</span>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground italic">
          Generating AI summary…
        </p>
      ) : summary ? (
        <p className="text-xs text-muted-foreground leading-relaxed min-h-[120px]">
          {summary}
        </p>
      ) : null}
    </li>
  );
}

export default function LatestArxivPapers() {
  const [arxivPapers, setArxivPapers] = useState<Paper[]>([]);
  const [deepmindPapers, setDeepmindPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch('/api/arxiv-papers').then((res) => {
        if (!res.ok) throw new Error('arXiv fetch failed');
        return res.json();
      }),
      fetch('/api/deepmind-papers').then((res) => {
        if (!res.ok) throw new Error('DeepMind fetch failed');
        return res.json();
      }),
    ])
      .then(([arxiv, deepmind]) => {
        setArxivPapers(Array.isArray(arxiv) ? arxiv : []);
        setDeepmindPapers(Array.isArray(deepmind) ? deepmind : []);
      })
      .catch(() => {
        setError('Failed to load papers');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="border border-border shadow-lg rounded-xl bg-card overflow-hidden mt-6">
      <div className="pb-4 px-6 pt-6 border-b border-border">
        <h3 className="text-xl font-semibold">Latest AI Research Papers</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Recent publications
        </p>
      </div>

      <div className="pt-4 px-6 pb-6">
        {loading && (
          <div className="text-muted-foreground text-center py-4">
            Loading research papers...
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* DeepMind section (AI summaries enabled) */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-2">
                DeepMind
              </div>

              {deepmindPapers.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No DeepMind publications found.
                </div>
              ) : (
                <ul className="space-y-4">
                  {deepmindPapers.map((paper) => (
                    <DeepmindPaperCard key={paper.link} paper={paper} />
                  ))}
                </ul>
              )}
            </div>

            {/* arXiv section (AI summaries enabled) */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-2">
                arXiv (cs.AI)
              </div>

              {arxivPapers.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No arXiv papers found.
                </div>
              ) : (
                <ul className="space-y-4">
                  {arxivPapers.map((paper) => (
                    <ArxivPaperCard key={paper.link} paper={paper} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-6 text-center">
          Sources:{' '}
          <a
            href="https://deepmind.google/research/publications/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            DeepMind
          </a>{' '}
          ·{' '}
          <a
            href="https://arxiv.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            arXiv
          </a>
        </div>
      </div>
    </div>
  );
}
