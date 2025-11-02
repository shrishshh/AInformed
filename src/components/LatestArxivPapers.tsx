'use client';
import { useEffect, useState } from 'react';

interface Paper {
  title: string;
  authors: string;
  link: string;
}

export default function LatestArxivPapers() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/arxiv-papers')
      .then(res => res.json())
      .then(data => {
        setPapers(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load papers');
        setLoading(false);
      });
  }, []);

  return (
    <div className="border border-border shadow-lg rounded-xl bg-card overflow-hidden mt-6">
      <div className="pb-4 px-6 pt-6 border-b border-border">
        <h3 className="text-xl font-semibold">Latest AI Research Papers</h3>
        <p className="text-sm text-muted-foreground mt-1">Recent publications</p>
      </div>
      <div className="pt-4 px-6 pb-6">
        {loading && <div className="text-muted-foreground text-center py-4">Loading research papers...</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-4">
            {papers.map((paper, index) => (
              <li key={paper.link} className="flex flex-col pb-3 border-b border-border last:border-0 last:pb-0">
                <a
                  href={paper.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 mb-1"
                >
                  {paper.title}
                </a>
                <span className="text-xs text-muted-foreground line-clamp-1">{paper.authors}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-xs text-muted-foreground mt-6 text-center">
          Papers from{' '}
          <a href="https://arxiv.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">arXiv</a>
        </div>
      </div>
    </div>
  );
} 