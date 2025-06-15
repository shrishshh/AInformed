"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import SearchResultsDisplay from "@/components/SearchResultsDisplay";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search news..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-white text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          Search
        </button>
      </form>

      <Suspense fallback={<p className="text-muted-foreground">Loading search results...</p>}>
        <SearchResultsDisplay />
      </Suspense>
    </div>
  );
} 