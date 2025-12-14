"use client";
import React from "react";
import Image from "next/image";

const AIToolsSection = () => {
  const aiTools = [
    { name: "ChatGPT", logo: "/Rectangle.png", color: "#10A37F", backgroundColor: "bg-[#10A37F]", url: "https://chat.openai.com" },
    { name: "Claude", logo: "/Rectangle-1.png", color: "#FF9900", backgroundColor: "bg-[#FF9900]", url: "https://claude.ai" },
    { name: "DALL-E", logo: "/Rectangle.png", color: "#8E54E9", backgroundColor: "bg-[#8E54E9]", url: "https://openai.com/dall-e" },
    { name: "Midjourney", logo: "/Rectangle-2.png", color: "#E91E63", backgroundColor: "bg-[#E91E63]", url: "https://www.midjourney.com" },
    { name: "TensorFlow", logo: "/Rectangle-3.png", color: "#FF6F00", backgroundColor: "bg-[#FF6F00]", url: "https://www.tensorflow.org" },
    { name: "PyTorch", logo: "/Rectangle-4.png", color: "#EE4C2C", backgroundColor: "bg-[#EE4C2C]", url: "https://pytorch.org" },
    { name: "Hugging Face", logo: "/Rectangle-5.png", color: "#FFD700", backgroundColor: "bg-[#FFD700]", url: "https://huggingface.co" },
    { name: "GitHub", logo: "/Rectangle-6.png", color: "#181717", backgroundColor: "bg-[#181717]", url: "https://github.com" },
  ];

  return (
    <section className="py-4 md:py-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Revolving icons on left */}
          <div className="relative h-96 w-96 mx-auto group">
            {/* Rotating container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              <div className="absolute inset-0 animate-spin-slow">
                {aiTools.map((tool, index) => {
                  const totalTools = aiTools.length;
                  const angle = (360 / totalTools) * index;
                  const radius = 150;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <div
                      key={index}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        transform: `translate(${x}px, ${y}px) rotate(${-angle}deg)`,
                      }}
                    >
                      {/* Counter-rotate to keep icon upright */}
                      <div className="animate-spin-reverse">
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/item block"
                        >
                          <div className="w-20 h-20 flex items-center justify-center hover:scale-125 transition-all duration-300 relative cursor-pointer">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <Image
                                src={tool.logo}
                                alt={tool.name}
                                width={80}
                                height={80}
                                className="object-contain w-full h-full max-w-[80px] max-h-[80px]"
                                style={{
                                  filter: 'contrast(1.2) brightness(0.95)',
                                  mixBlendMode: 'darken',
                                }}
                                unoptimized
                              />
                            </div>
                          </div>
                        
                        {/* Tooltip on hover - counter-rotate to keep text upright */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                          <div className="flex flex-col items-center" style={{ transform: 'rotate(180deg)' }}>
                            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold px-3 py-1.5 rounded whitespace-nowrap shadow-lg">
                              {tool.name}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                          </div>
                        </div>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Text content on right */}
          <div className="space-y-6 order-2 lg:order-2">
            {/* <div className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-medium text-primary">
              POWERED BY AI
            </div> */}
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your tools, working smarter together
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Seamlessly connect with cutting-edge AI tools — from language models to image generators, code assistants to ML platforms. AInformed brings everything together so you can stay informed about the latest AI developments across all major platforms and technologies.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIToolsSection;

