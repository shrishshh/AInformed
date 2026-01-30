"use client";

import { NewsCard } from '@/components/news-card';
import { useSupabaseBookmarks } from '@/hooks/useSupabaseBookmarks';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import WordExplanation from '@/components/NewComponents/WordExplanation';
import React, { useState, useEffect } from 'react';
import { useArticleSummary } from '@/hooks/useArticleSummary';
import { useWordDefinition } from '@/hooks/useWordDefinition';



interface NewsCardWithBookmarkProps {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  date: Date | string;
  url: string;
  readTime?: number;
}

export function NewsCardWithBookmark({
  id,
  title,
  summary,
  imageUrl,
  source,
  date,
  url,
  readTime = 4,
}: NewsCardWithBookmarkProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useSupabaseBookmarks();
  const { isLoggedIn } = useSupabaseAuth();
  const router = useRouter();
  const { summary: aiSummary, loading: summaryLoading } = useArticleSummary(summary);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);

  const handleWordSelect = (payload: { word: string; context: string; articleId: string }) => {
    const { word, context } = payload;
    console.log("Glossary word selected:", word, "with context:", context);
  
    setSelectedWord(word);
    setIsWordModalOpen(true);
    // Call your existing word explanation component here
    // Examples (use whichever matches your setup):
  
    // openGlossary(word)
    // setSelectedWord(word)
    // setGlossaryOpen(true)
  
    // For now, logging confirms it's wired correctly
  }

  // Use URL as the consistent identifier
  const articleId = url;

  const handleToggleBookmark = async (article: any) => {
    console.log('=== HANDLE TOGGLE BOOKMARK CALLED ===');
    console.log('Article:', article);
    console.log('isLoggedIn:', isLoggedIn);
    console.log('url prop:', url);
    
    if (!isLoggedIn) {
      console.log('Not logged in, redirecting to login...');
      router.push('/auth/login');
      return;
    }

    try {
      // Always use the URL prop as the article ID (this is what's stored as article_id in database)
      const articleIdToUse = url; // Use the url prop directly - it's consistent
      
      console.log('=== TOGGLING BOOKMARK ===');
      console.log('URL prop:', url);
      console.log('Article URL from handler:', article?.url);
      console.log('ArticleId to use:', articleIdToUse);
      
      // Check if currently bookmarked
      const currentlyBookmarked = isBookmarked(articleIdToUse);
      console.log('Is currently bookmarked?', currentlyBookmarked);
      
      if (currentlyBookmarked) {
        // Remove bookmark from Supabase
        console.log('Removing bookmark...');
        await removeBookmark(articleIdToUse);
        console.log('Bookmark removed successfully');
        toast.success('Bookmark removed', {
          description: 'Article removed from your bookmarks',
          duration: 3000,
        });
      } else {
        // Add bookmark to Supabase
        console.log('Adding bookmark...');
        await addBookmark({
          id: articleIdToUse, // This becomes article_id in database
          title: article?.title || title,
          url: article?.url || url,
          imageUrl: article?.imageUrl || imageUrl,
          source: article?.source || source,
          summary: article?.summary || summary,
        });
        console.log('Bookmark added successfully');
        toast.success('Bookmark saved', {
          description: 'Article saved to your bookmarks',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      console.error('Error stack:', error.stack);
      if (error.message?.includes('must be logged in') || error.message?.includes('logged in')) {
        router.push('/auth/login');
      } else {
        toast.error('Failed to update bookmark', {
          description: error.message || 'An error occurred. Please try again.',
          duration: 4000,
        });
      }
    }
  };

  return (
    <>
    <NewsCard
      id={id}
      title={title}
      summary={summary}
      imageUrl={imageUrl}
      source={source}
      date={date}
      url={url}
      readTime={readTime}
      isBookmarked={isBookmarked(articleId)}
      onToggleBookmark={handleToggleBookmark}
      onWordSelect={handleWordSelect}
    />

<WordExplanation
  word={selectedWord}
  context={aiSummary || summary} // AI summary if available, otherwise fallback
  isOpen={isWordModalOpen}
  onClose={() => setIsWordModalOpen(false)}
/>
  </>
  );
}

