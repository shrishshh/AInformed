'use client';

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Clock, User, TrendingUp } from "lucide-react"
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { ArticleCard } from "@/components/news/ArticleCard";
import { NewsArticle } from "@/lib/types"; // Import NewsArticle type

// Define the type for an article fetched from our API route
interface ApiNewsArticle {
  title: string;
  description: string; // Renamed from summary to match API output
  source: { 
    id?: string | null;
    name: string;
    url?: string;
  };
  url: string;
  image?: string | null; // Changed from imageUrl to image to match GNews API
  publishedAt: string; // Changed from publishedAT to publishedAt to match GNews API
  reliabilityScore?: number; // Include reliabilityScore from API or a default
}

// Define props for FeaturedArticles
interface FeaturedArticlesProps {
  articles: ApiNewsArticle[]; // Expecting ApiNewsArticle from page.tsx
  loading: boolean;
  error: string | null;
}

// Updated FeaturedArticles component to display real data received as props
export function FeaturedArticles({ articles, loading, error }: FeaturedArticlesProps) {
  const { savedArticles, saveArticle, unsaveArticle, isArticleSaved } = useSavedArticles();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        {/* You can add a spinner here */}
        <p>Loading AI news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-8">
        {error}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No AI or Technology news found.
      </div>
    );
  }

  // Map ApiNewsArticle to NewsArticle for rendering and saving
  const newsArticles: NewsArticle[] = articles.map(article => ({
    id: article.url, // Use URL as ID
    title: article.title,
    summary: article.description || '', // Map description to summary
    source: article.source?.name || 'Unknown', // Map source.name to source string
    url: article.url,
    imageUrl: article.image || null, // Map image to imageUrl
    publishedDate: article.publishedAt, // Map publishedAt to publishedDate
    reliabilityScore: article.reliabilityScore || null, // Map reliabilityScore, ensure it's number or null
  }));

  // Handler to toggle save status
  const handleToggleSave = (article: NewsArticle) => {
    if (isArticleSaved(article.url)) {
      unsaveArticle(article.url);
    } else {
      saveArticle(article);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Latest AI News</h2>
        {/* Assuming updates every hour is still relevant */}
        <Badge variant="outline">Updated live</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {newsArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isSaved={isArticleSaved(article.url)}
            onToggleSave={handleToggleSave}
          />
        ))}
      </div>
    </section>
  );
} 