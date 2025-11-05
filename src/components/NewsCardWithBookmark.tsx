"use client";

import { NewsCard } from '@/components/news-card';
import { useSupabaseBookmarks } from '@/hooks/useSupabaseBookmarks';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    />
  );
}

