"use client";

import { useState, useEffect } from "react";

import { FeaturedArticles } from "@/components/featured-articles";
import { TrendingTopics } from "@/components/trending-topics";
import { Footer } from "@/components/layout/Footer";
import { FeedCustomizationForm } from "@/components/news/FeedCustomizationForm";
import { RecentUpdates } from "@/components/RecentUpdates";

// Define a basic interface for the raw article data expected from the API route
interface ApiArticleData {
  title: string;
  description: string;
  source: { name: string; };
  url: string;
  image?: string | null;
  publishedAt: string;
}

export default function HomePage() {
  const [newsArticles, setNewsArticles] = useState<ApiArticleData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("AI OR technology");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/ai-news?q=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Raw API Data:", data);

        setNewsArticles(data.articles || []);
      } catch (err: any) {
        console.error('Error fetching news in page.tsx:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [searchQuery]);

  const handleSearchSubmit = (data: { searchQuery: string }) => {
    // Replace commas and surrounding whitespace with ' OR ' for GNews API compatibility
    let formattedQuery = data.searchQuery.replace(/\s*,\s*/g, ' OR ');
    // Also replace multiple spaces with a single space just in case
    formattedQuery = formattedQuery.replace(/\s+/g, ' ').trim();

    // Enclose query in quotes if it contains spaces or hyphens for GNews API compatibility
    const finalFormattedQuery = /[\s-]/.test(formattedQuery) ? `"${formattedQuery}"` : formattedQuery;

    setSearchQuery(finalFormattedQuery);
  };

  // Function to handle clicking on a trending topic
  const handleTopicClick = (topic: string) => {
    // Enclose topic in quotes if it contains spaces or hyphens for GNews API compatibility
    const formattedTopic = /[\s-]/.test(topic) ? `"${topic}"` : topic;
    setSearchQuery(formattedTopic); // Set the search query to the clicked topic
    // Optionally, you might want to clear the search input field in FeedCustomizationForm here
    // This would require adding a ref to FeedCustomizationForm or managing its state differently.
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        <div className="container mx-auto px-4 py-4">
          <FeedCustomizationForm onSubmit={handleSearchSubmit} isLoading={loading} />
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <FeaturedArticles articles={newsArticles} loading={loading} error={error} />
            </div>
            <div className="lg:col-span-1">
              <TrendingTopics articles={newsArticles.slice(0, 5)} onTopicClick={handleTopicClick} />
              <div className="mt-8">
                <RecentUpdates articles={newsArticles.slice(0, 4)} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
