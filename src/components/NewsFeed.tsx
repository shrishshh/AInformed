'use client';

import { useEffect, useState } from 'react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  image?: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/ai-news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        setNews(data.articles || []);
      } catch (err) {
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item, idx) => (
        <div key={idx} className="border p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          {item.image && (
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-lg font-semibold hover:text-blue-600 transition-colors"
          >
            {item.title}
          </a>
          <p className="text-sm text-gray-600 mt-2">
            {new Date(item.publishedAt).toLocaleDateString()}
          </p>
          <p className="mt-2 text-gray-700">{item.description}</p>
        </div>
      ))}
    </div>
  );
} 