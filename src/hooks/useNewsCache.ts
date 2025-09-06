'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface NewsParams {
  category?: string;
  query?: string;
  page?: number;
  limit?: number;
}

interface NewsResponse {
  articles: any[];
  _isMockData: boolean;
  _sources: {
    gnews: number;
    rss: number;
    gdelt: number;
    hn: number;
    total: number;
  };
  timestamp: string;
}

// Fetch news with caching
async function fetchNews(params: NewsParams): Promise<NewsResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.append('category', params.category);
  if (params.query) searchParams.append('q', params.query);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(`/api/ai-news?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch news');
  }
  return response.json();
}

export function useNews(params: NewsParams = {}) {
  const queryClient = useQueryClient();
  
  // Generate a stable query key
  const queryKey = ['news', params];
  
  const query = useQuery({
    queryKey,
    queryFn: () => fetchNews(params),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false,     // Don't refetch on component mount if data is fresh
    retry: 2,                  // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Prefetch next page for better UX
  const prefetchNextPage = () => {
    if (params.page && params.page > 0) {
      const nextPageParams = { ...params, page: params.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['news', nextPageParams],
        queryFn: () => fetchNews(nextPageParams),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  // Prefetch previous page
  const prefetchPrevPage = () => {
    if (params.page && params.page > 1) {
      const prevPageParams = { ...params, page: params.page - 1 };
      queryClient.prefetchQuery({
        queryKey: ['news', prevPageParams],
        queryFn: () => fetchNews(prevPageParams),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  // Invalidate and refetch news
  const refreshNews = () => {
    queryClient.invalidateQueries({ queryKey: ['news'] });
  };

  // Clear all news cache
  const clearNewsCache = () => {
    queryClient.removeQueries({ queryKey: ['news'] });
  };

  return {
    ...query,
    prefetchNextPage,
    prefetchPrevPage,
    refreshNews,
    clearNewsCache,
  };
}

// Hook for getting news by category
export function useNewsByCategory(category: string, page: number = 1) {
  return useNews({ category, page, limit: 20 });
}

// Hook for getting news by search query
export function useNewsByQuery(query: string, page: number = 1) {
  return useNews({ query, page, limit: 20 });
}

// Hook for getting paginated news
export function usePaginatedNews(page: number = 1, limit: number = 20) {
  return useNews({ page, limit });
}

