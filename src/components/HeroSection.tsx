"use client";
import React from "react";
// import DecryptedText from "./DecryptedText";

const HeroSection = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center py-12 md:py-16 text-center overflow-hidden">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight text-black dark:text-white">
        Stay Ahead of the <span className="text-black dark:text-white">AI Revolution</span>
      </h1>
      <p className="text-base md:text-lg max-w-2xl mx-auto text-black dark:text-white">
        Discover the latest breakthroughs, insights, and trends shaping the future of artificial intelligence
      </p>
    </section>
  );
};

export default HeroSection; 