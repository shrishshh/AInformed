
"use client";

import { ArticleCard } from "@/components/news/ArticleCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import type { NewsArticle } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { BookmarkX } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function SavedArticlesPage() {
  const { savedArticles, unsaveArticle, isArticleSaved, isLoaded } = useSavedArticles();
  const { toast } = useToast();

  const handleToggleSave = (article: NewsArticle) => {
    // In saved articles page, toggle save means unsave
    unsaveArticle(article.url);
    toast({ title: "Article Unsaved", description: `"${article.title}" removed from your saved list.` });
  };
  
  if (!isLoaded) {
    return (
      <PageWrapper className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size={48} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h1 className="text-3xl font-bold mb-8">Saved Articles</h1>
      {savedArticles.length === 0 ? (
         <div className="flex flex-col items-center justify-center my-12 text-center">
            <BookmarkX className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Saved Articles</h2>
            <p className="text-muted-foreground">
              You haven't saved any articles yet. Start exploring the feed!
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isSaved={isArticleSaved(article.url)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
