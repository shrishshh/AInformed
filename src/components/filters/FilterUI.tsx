"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // <-- Edit Location 1

export default function FilterUI() {
  const [open, setOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const topics = [
    "AI",
    "Robotics",
    "Startups",
    "Research",
    "Policy",
    "OpenAI",
    "Big Tech",
    "Ethics",
    "Hardware",
  ];

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  return (
    <div className="mb-10 w-full max-w-7xl mx-auto">
      {/* Morphing container */}
      <motion.div
        layout
        initial={{ borderRadius: "9999px" }}
        animate={{ borderRadius: open ? "2xl" : "9999px" }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="border shadow-sm"
      >
        {/* Header (the original button) */}
        <motion.button
          layout
          onClick={() => setOpen(!open)}
          className="w-full flex justify-between items-center px-5 py-3 rounded-t-2xl md:rounded-2xl bg-white text-sm font-medium shadow-sm hover:bg-muted"
        >
          Filters
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </motion.button>

        {/* Animated panel content */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="overflow-hidden bg-background px-5 py-6 rounded-b-2xl"
            >
              {/* Topics row */}
              <div className="mb-6 overflow-x-auto">
                <div className="flex w-max gap-2">
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

              {/* Footer actions */}
              <div className="mt-8 flex items-center justify-between">
                <button className="text-sm text-muted-foreground hover:underline">Clear all</button>
                <button className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90">
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
