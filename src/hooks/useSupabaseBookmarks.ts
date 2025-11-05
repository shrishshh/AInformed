"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseAuth } from './useSupabaseAuth';

interface Bookmark {
  id: number;
  user_id: string;
  article_id: string;
  title: string;
  url: string;
  image_url?: string;
  source?: string;
  description?: string;
  summary?: string;
  created_at: string;
}

export function useSupabaseBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoggedIn } = useSupabaseAuth();

  // Load bookmarks when user changes
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    loadBookmarks();
  }, [user?.id, isLoggedIn]); // Use user.id instead of user to avoid unnecessary re-renders

  const loadBookmarks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookmarks:', error);
    } else {
      setBookmarks(data || []);
    }
    setLoading(false);
  };

  const addBookmark = useCallback(async (article: {
    id: string;
    title: string;
    url: string;
    imageUrl?: string;
    source?: string;
    summary?: string;
  }) => {
    if (!user) {
      throw new Error('You must be logged in to save bookmarks');
    }

    // Check if already bookmarked
    const existing = bookmarks.find(b => b.article_id === article.id);
    if (existing) {
      console.log('Article already bookmarked');
      return existing;
    }

    console.log('Adding bookmark:', article);

    // Build insert object with all columns from your table
    const insertData: any = {
      user_id: user.id,
      article_id: article.id,
      title: article.title,
      url: article.url,
    };

    // Include optional fields if they exist
    if (article.imageUrl) insertData.image_url = article.imageUrl;
    if (article.source) insertData.source = article.source;
    if (article.summary) {
      insertData.description = article.summary;
      insertData.summary = article.summary;
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error adding bookmark:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('Bookmark added successfully:', data);
    // Update bookmarks state
    setBookmarks((prev) => {
      // Check if it's already in the list (shouldn't be, but just in case)
      if (prev.find(b => b.article_id === article.id)) {
        return prev;
      }
      return [data, ...prev];
    });
    return data;
  }, [user, bookmarks]);

  const removeBookmark = useCallback(async (articleId: string) => {
    if (!user) {
      throw new Error('You must be logged in to remove bookmarks');
    }

    console.log('=== REMOVING BOOKMARK ===');
    console.log('Article ID to remove:', articleId);
    console.log('User ID:', user.id);
    console.log('Current bookmarks before removal:', bookmarks.length);

    // Normalize the articleId for comparison (remove trailing slashes)
    const normalizedArticleId = articleId.trim().replace(/\/+$/, '');

    // First, find the bookmark by matching article_id or url (normalized)
    // This ensures we get the exact article_id value stored in the database
    const { data: allBookmarks, error: fetchError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching bookmarks for removal:', fetchError);
      throw fetchError;
    }

    console.log('All bookmarks from database:', allBookmarks?.map(b => ({
      article_id: b.article_id,
      url: b.url,
      title: b.title
    })));

    // Find matching bookmark by comparing normalized values
    const matchingBookmark = allBookmarks?.find(b => {
      const normalizedArticleId_db = b.article_id?.trim().replace(/\/+$/, '') || '';
      const normalizedUrl = b.url?.trim().replace(/\/+$/, '') || '';
      const matches = normalizedArticleId_db === normalizedArticleId || normalizedUrl === normalizedArticleId;
      if (matches) {
        console.log('Found matching bookmark:', {
          db_article_id: b.article_id,
          db_url: b.url,
          search_id: articleId
        });
      }
      return matches;
    });

    if (!matchingBookmark) {
      console.warn('No matching bookmark found to delete');
      console.warn('Searched for:', normalizedArticleId);
      console.warn('Available article_ids:', allBookmarks?.map(b => b.article_id));
      // Still update local state to remove it if it exists
      setBookmarks((prev) => {
        return prev.filter((b) => {
          const normalizedArticleId_db = b.article_id?.trim().replace(/\/+$/, '') || '';
          const normalizedUrl = b.url?.trim().replace(/\/+$/, '') || '';
          return normalizedArticleId_db !== normalizedArticleId && normalizedUrl !== normalizedArticleId;
        });
      });
      return;
    }

    // Delete using the bookmark's database ID (primary key) - more reliable
    console.log('Deleting bookmark with database id:', matchingBookmark.id);
    console.log('Bookmark details:', {
      id: matchingBookmark.id,
      article_id: matchingBookmark.article_id,
      url: matchingBookmark.url,
      user_id: matchingBookmark.user_id
    });
    
    // Try deleting by database ID first (most reliable)
    console.log('Attempting delete by id:', matchingBookmark.id);
    let { error, data } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', matchingBookmark.id)
      .select();

    console.log('Delete by id result:', { error, data, dataLength: data?.length });

    // If that didn't work or returned empty, try by article_id
    if (error || !data || data.length === 0) {
      console.log('Delete by ID returned empty, trying by article_id...');
      const result = await supabase
        .from('bookmarks')
        .delete()
        .eq('article_id', matchingBookmark.article_id)
        .eq('user_id', user.id)
        .select();
      error = result.error;
      data = result.data;
      console.log('Delete by article_id result:', { error, data, dataLength: data?.length });
    }

    // If still no result, try deleting by matching both article_id and url
    if (!error && (!data || data.length === 0)) {
      console.log('Both deletes returned empty, trying by url...');
      const result = await supabase
        .from('bookmarks')
        .delete()
        .eq('url', matchingBookmark.url)
        .eq('user_id', user.id)
        .select();
      if (result.error) {
        error = result.error;
      } else if (result.data && result.data.length > 0) {
        data = result.data;
      }
      console.log('Delete by url result:', { error, data, dataLength: data?.length });
    }

    if (error) {
      console.error('Error removing bookmark from database:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('Delete query executed but returned no rows. This might be an RLS policy issue.');
      console.warn('The bookmark might not have been deleted. Removing from local state anyway.');
      // Still update local state to remove it from UI
    } else {
      console.log('Successfully deleted from database:', data);
    }

    // Update local state immediately (optimistic update)
    // This ensures the UI updates even if there's a database issue
    setBookmarks((prev) => {
      const filtered = prev.filter((b) => {
        const normalizedArticleId_db = b.article_id?.trim().replace(/\/+$/, '') || '';
        const normalizedUrl = b.url?.trim().replace(/\/+$/, '') || '';
        const matches = normalizedArticleId_db === normalizedArticleId || normalizedUrl === normalizedArticleId;
        if (!matches) {
          return true; // Keep this bookmark
        } else {
          console.log('Removing from local state:', b.title);
          return false; // Remove this bookmark
        }
      });
      console.log(`Local state updated: ${prev.length} → ${filtered.length}`);
      return filtered;
    });

    // Reload bookmarks from database to ensure UI is in sync with database
    const { data: updatedBookmarks, error: reloadError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (reloadError) {
      console.error('Error reloading bookmarks:', reloadError);
      // Local state already updated above, so UI should be correct
    } else {
      // Use the reloaded bookmarks from database (this might add it back if delete failed)
      setBookmarks(updatedBookmarks || []);
      console.log('Bookmarks reloaded from database:', updatedBookmarks?.length || 0);
      
      // If reload shows the bookmark still exists, there might be an RLS issue
      const stillExists = updatedBookmarks?.some(b => {
        const normalizedArticleId_db = b.article_id?.trim().replace(/\/+$/, '') || '';
        const normalizedUrl = b.url?.trim().replace(/\/+$/, '') || '';
        return normalizedArticleId_db === normalizedArticleId || normalizedUrl === normalizedArticleId;
      });
      
      if (stillExists && (!data || data.length === 0)) {
        console.error('⚠️ RLS POLICY ISSUE: Bookmark still exists after delete attempt.');
        console.error('Please check your Supabase RLS policies allow DELETE operations.');
        console.error('The bookmark was removed from UI but may still be in database.');
      }
    }
  }, [user, bookmarks]);

  const isBookmarked = useCallback((articleId: string) => {
    // Normalize the articleId for comparison
    const normalizedArticleId = articleId.trim().replace(/\/+$/, '');
    return bookmarks.some((b) => {
      const normalizedArticleId_db = b.article_id?.trim().replace(/\/+$/, '') || '';
      const normalizedUrl = b.url?.trim().replace(/\/+$/, '') || '';
      return normalizedArticleId_db === normalizedArticleId || normalizedUrl === normalizedArticleId;
    });
  }, [bookmarks]);

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    loadBookmarks,
  };
}

