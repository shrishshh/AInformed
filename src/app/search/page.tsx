"use client";
import { Suspense } from "react";
import SearchResultsDisplay from "@/components/SearchResultsDisplay";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <Suspense fallback={<p className="text-muted-foreground">Loading search results...</p>}>
        <SearchResultsDisplay />
      </Suspense>
    </div>
  );
} 