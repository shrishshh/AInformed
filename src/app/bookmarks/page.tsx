"use client";
import { useEffect, useState } from "react";
import { NewsCardWithBookmark } from "@/components/NewsCardWithBookmark";
import { useSupabaseBookmarks } from "@/hooks/useSupabaseBookmarks";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const { bookmarks, loading } = useSupabaseBookmarks();
  const { isLoggedIn, loading: authLoading } = useSupabaseAuth();

  if (authLoading || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container px-4 py-8 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Please sign in to view and manage your bookmarks.
        </p>
        <Link href="/auth/login">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Bookmarks</h1>
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No bookmarks yet. Start saving articles you want to read later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => (
            <NewsCardWithBookmark
              key={`${bookmark.user_id}-${bookmark.article_id}`}
              id={bookmark.article_id}
              title={bookmark.title}
              summary={bookmark.summary || bookmark.description || ''}
              imageUrl={bookmark.image_url || ''}
              source={bookmark.source || 'Unknown'}
              date={bookmark.created_at}
              url={bookmark.url}
              readTime={4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
