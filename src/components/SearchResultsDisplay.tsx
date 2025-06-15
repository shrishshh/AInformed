'use client'

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { NewsCard } from '@/components/news-card';
import { useSavedArticles } from "@/hooks/useSavedArticles";

export default function SearchResultsDisplay() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isArticleSaved, saveArticle, unsaveArticle } = useSavedArticles();

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {results.map((article: any) => (
        <NewsCard
          key={article.url}
          id={article.url}
          title={article.title}
          summary={article.description}
          imageUrl={article.image}
          source={article.source.name}
          date={article.publishedAt}
          url={article.url}
          readTime={4}
          isBookmarked={isArticleSaved(article.url)}
          onToggleBookmark={article => isArticleSaved(article.url) ? unsaveArticle(article.url) : saveArticle(article)}
        />
      ))}
    </div>
  );
} 