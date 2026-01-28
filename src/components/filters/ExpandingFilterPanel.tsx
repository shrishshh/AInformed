"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExpandingPanel() {
  const [open, setOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const topics = [
    "All Topics",
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Robotics",
    "Data Science",
    "Cybersecurity",
    "Quantum Computing",
    "AI Ethics",
    "Neural Networks",
    "Automation",
  ];

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  return (
    <div className="relative">
      {/* Container */}
      <div
        className={`
          overflow-hidden
          transition-[width,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
          bg-background border-2 border-purple-500/50 shadow-lg
          rounded-xl
          ${
            open
              ? "w-[100%] p-4"
              : "w-[190px] p-2"
          }
        `}
      >
        {/* Button (collapsed state) */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className={`
              flex items-center justify-center
              h-10
              px-3
              text-lg font-semibold
              bg-background hover:bg-purple-50
              rounded-xl
              leading-none
              transition
              whitespace-nowrap
              gap-2
              ${open ? "opacity-0 pointer-events-none" : "opacity-100"}
            `}
          >
            <Filter className="size-5" />
            Filter Articles
          </button>
        )}

        {/* Panel Content (expanded state) */}
        {open && (
          //<div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300">
          <AnimatePresence initial={false}>
  {open && (
    <motion.div
      key="panel"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        opacity: { duration: 0.25 },
        height: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      }}
      className="flex flex-col overflow-hidden"
    >
          <div className="flex flex-col">
            <div className="flex justify-center items-center mb-2">
              <h3 className="text-lg font-semibold">Filter Articles</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-black absolute right-4 top-4"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 text-sm text-gray-600">
                {/* Topics row */}
                <div className="mb-6 max-w-full overflow-x-auto">
                <div className="flex w-max gap-2 pb-4">
                  {topics.map((topic) => {
                    const active = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition 
                          ${active
                            ? "bg-primary text-primary-foreground"
                            : "border bg-muted hover:bg-muted/70"
                          }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Three-column layout */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Source */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Source
                  </h4>
                  <div className="space-y-2">
                    {["OpenAI Blog", "MIT Tech Review", "ArXiv", "The Verge"].map((source) => (
                      <label key={source} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" className="accent-primary" />
                        {source}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Time
                  </h4>
                  <div className="space-y-2">
                    {["Last 24 hours", "Past week", "Past month", "Past year"].map((time) => (
                      <label key={time} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="radio" name="time" className="accent-primary" />
                        {time}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Location
                  </h4>
                  <div className="space-y-2">
                    {["United States", "Europe", "Asia", "Global"].map((loc) => (
                      <label key={loc} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" className="accent-primary" />
                        {loc}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
            </div>

            {/* Footer actions */}
            <div className="mt-8 flex items-center justify-between">
                <button className="text-sm text-muted-foreground hover:underline">Clear all</button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-blue-600 h-9 rounded-md px-3 readmore-btn relative z-1">
                  Apply Filters
                </button>
              </div>
          </div>
          </motion.div>
                  )}
        </AnimatePresence>
        )}
      </div>
    </div>
  );
}