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
    <div className="border-0 shadow-sm rounded-xl bg-card/80 mt-6">
      <div className="pb-3 px-6 pt-6">
        <h3 className="text-lg flex items-center gap-2 font-bold">Latest AI Research Papers</h3>
      </div>
      <div className="pt-0 px-6 pb-4">
        {loading && <div className="text-muted-foreground">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-3">
            {papers.map((paper) => (
              <li key={paper.link} className="flex flex-col">
                <a
                  href={paper.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline font-medium line-clamp-2"
                >
                  📄 {paper.title}
                </a>
                <span className="text-sm text-muted-foreground truncate">{paper.authors}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-xs text-muted-foreground mt-4 text-right">
          Papers from{' '}
          <a href="https://arxiv.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">arXiv</a>
        </div>
      </div>
    </div>
  );
} 