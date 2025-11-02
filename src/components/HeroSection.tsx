"use client";
import React from "react";
import NewsSourceBanner from "./NewsSourceBanner";

const HeroSection = () => {
  return (
    <section className="relative w-full flex flex-col items-center py-8 md:py-12 overflow-hidden">
      {/* Animated gradient background orbs */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse opacity-50" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse opacity-30" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
        {/* Content Box */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border border-blue-200/50 dark:border-slate-700/50 rounded-2xl p-8 md:p-12 mb-4 shadow-xl backdrop-blur-sm">
          <div className="text-center">
            {/* Main heading */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Stay Informed About AI
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground mb-10 leading-relaxed">
              Discover the latest breakthroughs, insights, and trends shaping the future of artificial intelligence
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center items-center">
              <button 
                onClick={() => {
                  const newsSection = document.getElementById('news-section');
                  if (newsSection) {
                    newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Explore Latest News
              </button>
            </div>
          </div>
        </div>
        
        {/* News Sources Scrolling Banner - Outside the box */}
        <NewsSourceBanner />
      </div>
    </section>
  );
};

export default HeroSection; 