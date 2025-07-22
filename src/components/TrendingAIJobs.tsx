'use client';
import { useEffect, useState } from 'react';

interface Job {
  title: string;
  company: string;
  url: string;
}

export default function TrendingAIJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trending-ai-jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load jobs');
        setLoading(false);
      });
  }, []);

  return (
    <div className="border-0 shadow-sm rounded-xl bg-card/80 mt-6">
      <div className="pb-3 px-6 pt-6">
        <h3 className="text-lg flex items-center gap-2 font-bold">Trending Jobs</h3>
      </div>
      <div className="pt-0 px-6 pb-4">
        {loading && <div className="text-muted-foreground">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.url} className="flex flex-col">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline font-medium"
                >
                  📈 {job.title}
                </a>
                <span className="text-sm text-muted-foreground">{job.company}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-xs text-muted-foreground mt-4 text-right">
          Jobs powered by{' '}
          <a href="https://remotive.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Remotive</a>
        </div>
      </div>
    </div>
  );
} 