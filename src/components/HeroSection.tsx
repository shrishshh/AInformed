"use client";
import React from "react";
// import DecryptedText from "./DecryptedText";

const HeroSection = () => {
  return (
    <section className="w-full flex flex-col items-center justify-center py-8 text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
        Stay Ahead of the <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">AI Revolution</span>
      </h1>
      <p className="text-lg md:text-xl mb-0 max-w-2xl mx-auto">
        Discover the latest breakthroughs, insights, and trends shaping the future of artificial intelligence
      </p>
    </section>
  );
};

export default HeroSection; 