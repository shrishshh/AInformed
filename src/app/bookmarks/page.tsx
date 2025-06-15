"use client";
import { useEffect, useState } from "react";
import { NewsCard } from "@/components/news-card";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    const loadBookmarks = () => {
      const saved = localStorage.getItem('bookmarks');
      if (saved) {
        // Deduplicate by title+source
        const arr = JSON.parse(saved);
        const unique: any[] = [];
        const seen = new Set();
        for (const article of arr) {
          const key = article.title + '|' + article.source;
          if (!seen.has(key)) {
            unique.push(article);
            seen.add(key);
          }
        }
        setBookmarks(unique);
      }
    };
    loadBookmarks();
    window.addEventListener('storage', loadBookmarks);
    return () => window.removeEventListener('storage', loadBookmarks);
  }, []);

  const handleToggleBookmark = (article: any) => {
    const updated = bookmarks.filter((a) => a.url !== article.url);
    setBookmarks(updated);
    localStorage.setItem('bookmarks', JSON.stringify(updated));
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bookmarks</h1>
      {bookmarks.length === 0 ? (
        <p className="text-muted-foreground">Your saved articles will appear here.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookmarks.map((article: any) => (
            <NewsCard
              key={article.url}
              id={article.url}
              title={article.title}
              summary={article.description}
              imageUrl={article.image}
              source={article.source}
              date={article.publishedAt || article.date}
              url={article.url}
              readTime={4}
              isBookmarked={true}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
} 