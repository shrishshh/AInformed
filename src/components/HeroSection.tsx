"use client";
import React from "react";
// import DecryptedText from "./DecryptedText";

const HeroSection = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center py-12 md:py-16 text-center overflow-hidden">
      {/* Decorative gradient mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full blur-3xl opacity-30 bg-[radial-gradient(ellipse_at_center,theme(colors.cyan.500),transparent_60%)]" />
        <div className="absolute -bottom-24 -left-24 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-25 bg-[radial-gradient(ellipse_at_center,theme(colors.purple.600),transparent_60%)]" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20 bg-[radial-gradient(ellipse_at_center,theme(colors.blue.500),transparent_60%)]" />
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight">
        Stay Ahead of the <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">AI Revolution</span>
      </h1>
      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
        Discover the latest breakthroughs, insights, and trends shaping the future of artificial intelligence
      </p>
    </section>
  );
};

export default HeroSection; 