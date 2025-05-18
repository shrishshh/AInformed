
"use client";

import type { NewsArticle } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";

const SAVED_ARTICLES_KEY = "newsWiseSavedArticles";

export function useSavedArticles() {
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedArticles = localStorage.getItem(SAVED_ARTICLES_KEY);
      if (storedArticles) {
        setSavedArticles(JSON.parse(storedArticles));
      }
      setIsLoaded(true);
    }
  }, []);

  const saveArticle = useCallback(
    (article: NewsArticle) => {
      const newSavedArticles = [...savedArticles, article];
      setSavedArticles(newSavedArticles);
      localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(newSavedArticles));
    },
    [savedArticles]
  );

  const unsaveArticle = useCallback(
    (articleUrl: string) => {
      const newSavedArticles = savedArticles.filter(
        (article) => article.url !== articleUrl
      );
      setSavedArticles(newSavedArticles);
      localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(newSavedArticles));
    },
    [savedArticles]
  );

  const isArticleSaved = useCallback(
    (articleUrl: string) => {
      return savedArticles.some((article) => article.url === articleUrl);
    },
    [savedArticles]
  );

  return { savedArticles, saveArticle, unsaveArticle, isArticleSaved, isLoaded };
}
