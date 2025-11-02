"use client";
import React from "react";

const NewsSourceBanner = () => {
  // List of all news sources (RSS feeds + API sources)
  const newsSources = [
    "Google News",
    "MIT Tech Review",
    "Wired",
    "Ars Technica", 
    "TechCrunch AI",
    "VentureBeat AI",
    "The Verge",
    "Engadget",
    "Gizmodo",
    "TechRadar",
    "ZDNet",
    "HackerNews",
    "GDELT",
    "arXiv",
  ];

  // Duplicate the array for seamless infinite scrolling
  const duplicatedSources = [...newsSources, ...newsSources];

  return (
    <div className="relative w-full overflow-hidden py-8 border-y border-border/50 group">
      <div className="flex animate-marquee whitespace-nowrap">
        {duplicatedSources.map((source, index) => (
          <div
            key={index}
            className="inline-flex items-center mx-6 text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            <span className="text-lg md:text-xl font-medium">{source}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsSourceBanner;

