'use client'

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { NewsCard } from '@/components/news-card';
import { useSupabaseBookmarks } from '@/hooks/useSupabaseBookmarks';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function SearchResultsDisplay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isBookmarked, addBookmark, removeBookmark } = useSupabaseBookmarks();
  const { isLoggedIn } = useSupabaseAuth();

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      fetch(`/api/ai-news?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          const articles = data.articles || [];
          const uniqueArticles: any[] = [];
          const seen = new Set();
          for (const article of articles) {
            if (!seen.has(article.url)) {
              uniqueArticles.push(article);
              seen.add(article.url);
            }
          }
          setResults(uniqueArticles);
        })
        .finally(() => setIsLoading(false));
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [query]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading search results...</p>;
  }

  if (results.length === 0) {
    return <p className="text-muted-foreground">No results found for "{query}".</p>;
  }

  const handleToggleBookmark = async (article: any) => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }

    try {
      const articleId = article.url || article.id;
      if (isBookmarked(articleId)) {
        await removeBookmark(articleId);
      } else {
        await addBookmark({
          id: articleId,
          title: article.title,
          url: article.url,
          imageUrl: article.image,
          source: article.source?.name || article.source,
          summary: article.description,
        });
      }
    } catch (error: any) {
      if (error.message?.includes('must be logged in') || error.message?.includes('logged in')) {
        router.push('/auth/login');
      }
      console.error('Error toggling bookmark:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {results.map((article: any) => (
        <NewsCard
          key={article.url}
          id={article.url}
          title={article.title}
          summary={article.description}
          imageUrl={article.image}
          source={article.source?.name || article.source}
          date={article.publishedAt}
          url={article.url}
          readTime={4}
          isBookmarked={isBookmarked(article.url)}
          onToggleBookmark={handleToggleBookmark}
        />
      ))}
    </div>
  );
} 