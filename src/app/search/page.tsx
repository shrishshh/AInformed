"use client";
import { Suspense } from "react";
import SearchResultsDisplay from "@/components/SearchResultsDisplay";

export default function SearchPage() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <Suspense fallback={<p className="text-muted-foreground">Loading search results...</p>}>
        <SearchResultsDisplay />
      </Suspense>
    </div>
  );
} 