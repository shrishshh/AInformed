
"use client";

import { useState, useEffect } from "react";
import type { NewsArticle } from "@/lib/types";
import { ArticleCard } from "@/components/news/ArticleCard";
import { FeedCustomizationForm } from "@/components/news/FeedCustomizationForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { generateNewsFeed, GenerateNewsFeedInput, GenerateNewsFeedOutput } from "@/ai/flows/generate-news-feed";
import { useToast } from "@/hooks/use-toast";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { AlertTriangle, ListX } from "lucide-react"; // Changed to AlertTriangle
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FEED_PREFERENCES_KEY = "AInformedFeedPreferences_v2"; // Updated key for new form structure

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { savedArticles, saveArticle, unsaveArticle, isArticleSaved } = useSavedArticles();
  const [initialFormValues, setInitialFormValues] = useState<Partial<GenerateNewsFeedInput> | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPreferences = localStorage.getItem(FEED_PREFERENCES_KEY);
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences) as GenerateNewsFeedInput;
          // Ensure parsedPrefs has the expected structure for the new form.
          // The new form expects keywords, topics, reliabilityScore, numberOfArticles for initial fetch.
          setInitialFormValues({
            keywords: parsedPrefs.keywords || ["AI", "technology"],
            topics: parsedPrefs.topics || ["latest news", "innovations"],
            reliabilityScore: parsedPrefs.reliabilityScore || 0.7,
            numberOfArticles: parsedPrefs.numberOfArticles || 5,
          });
          // Automatically fetch news on load if preferences exist
          fetchNews(parsedPrefs);
        } catch (e) {
          console.error("Failed to parse stored preferences", e);
          localStorage.removeItem(FEED_PREFERENCES_KEY); // Clear corrupted data
           setInitialFormValues({ 
            keywords: ["AI", "technology"], 
            topics: ["latest news", "innovations"], 
            reliabilityScore: 0.7,
            numberOfArticles: 5 
          });
        }
      } else {
        // Set initial state for form if no preferences stored
        const defaultPrefs = { 
          keywords: ["AI", "technology"], 
          topics: ["latest news", "innovations"], 
          reliabilityScore: 0.7,
          numberOfArticles: 5 
        };
        setInitialFormValues(defaultPrefs);
        // Optionally, fetch with default preferences on first load
        // fetchNews(defaultPrefs); 
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchNews = async (input: GenerateNewsFeedInput) => {
    setIsLoading(true);
    setError(null);
    setArticles([]); 

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(FEED_PREFERENCES_KEY, JSON.stringify(input));
      }
      const result: GenerateNewsFeedOutput = await generateNewsFeed(input);
      if (result.articles && result.articles.length > 0) {
        const articlesWithPlaceholders: NewsArticle[] = result.articles.map((article, index) => ({
          ...article,
          id: article.url || `article-${Date.now()}-${index}`,
          imageUrl: `https://placehold.co/600x400.png?t=${Date.now()}-${index}`,
          publishedDate: new Date().toISOString(), 
        }));
        setArticles(articlesWithPlaceholders);
      } else {
        setArticles([]);
        toast({
          title: "No Articles Found",
          description: "Try adjusting your search query for different results.",
        });
      }
    } catch (e: any) {
      console.error("Failed to fetch news feed:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(`Failed to generate news feed. ${errorMessage}. Please try again later.`);
      toast({
        title: "Error Fetching News",
        description: "There was a problem connecting to the news service.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryFetch = () => {
    if (initialFormValues) {
      // Use the last known good input or default
      const lastInput = localStorage.getItem(FEED_PREFERENCES_KEY);
      if (lastInput) {
        fetchNews(JSON.parse(lastInput));
      } else {
         fetchNews({ 
            keywords: ["AI", "technology"], 
            topics: ["latest news", "innovations"], 
            reliabilityScore: 0.7,
            numberOfArticles: 5 
          });
      }
    }
  };

  const handleToggleSave = (article: NewsArticle) => {
    if (isArticleSaved(article.url)) {
      unsaveArticle(article.url);
      toast({ title: "Article Unsaved", description: `"${article.title}" removed from your saved list.` });
    } else {
      saveArticle(article);
      toast({ title: "Article Saved", description: `"${article.title}" added to your saved list.` });
    }
  };

  return (
    <PageWrapper>
      {initialFormValues && <FeedCustomizationForm onSubmit={fetchNews} isLoading={isLoading} initialValues={initialFormValues} />}

      {isLoading && (
        <div className="flex flex-col items-center justify-center my-12">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-lg text-muted-foreground">Generating your personalized feed...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="my-8 text-center bg-card border-border shadow-xl max-w-md mx-auto">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-foreground">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error.includes("Failed to generate news feed.") ? error.split("Failed to generate news feed.")[1].trim().split("Please try again later.")[0].trim() : "Failed to fetch"}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleRetryFetch} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Retry
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !error && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center my-12 text-center">
          <ListX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">No Articles Yet</h2>
          <p className="text-muted-foreground">
            Enter a search query above and press Enter to see articles.
          </p>
        </div>
      )}

      {!isLoading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
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
