"use client";

import { useMemo, useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { OFFICIAL_AI_SOURCES } from "@/lib/sources/officialSources";

export default function ExpandingPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const HIDDEN_SOURCES = useMemo(
    () =>
      new Set([
        "The Gradient",
        "Mistral",
        "KDnuggets",
        "HackerNews",
        "Stability AI",
        "ZDNet",
        "Wired",
        "Cohere",
        "Ars Technica",
        "GDELT",
        "Microsoft Research",
        "TechCrunch AI",
        "TechRadar",
        "VentureBeat AI",
        "GNews",
        "Hugging Face",
        "MIT Tech Review",
        "DeepMind",
        "Anthropic",
        "Microsoft AI",
      ]),
    []
  );
  const [openDropdowns, setOpenDropdowns] = useState({
    source: false,
    time: false,
    location: false,
  });

  const toggleDropdown = (key: keyof typeof openDropdowns) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getSectionTransition = (index: number) => ({
    delay: 0.5 + index * 0.12,
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1] as const,
  });

  const getItemTransition = (index: number) => ({
    delay: index * 0.07,
    duration: 0.35,
    ease: [0.22, 1, 0.36, 1] as const,
  });

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

  const allSourceOptions = useMemo(() => {
    const base = OFFICIAL_AI_SOURCES.map((s) => s.company);
    const extra = ["Instagram"];
    const uniq = Array.from(new Set([...base, ...extra]))
      .filter(Boolean)
      .filter((s) => !HIDDEN_SOURCES.has(s));
    uniq.sort((a, b) => a.localeCompare(b));
    return uniq;
  }, [HIDDEN_SOURCES]);

  const syncFromUrl = () => {
    const topicsParam = searchParams.get("topics") || "";
    const sourcesParam = searchParams.get("sources") || "";
    const timeParam = searchParams.get("time") || "";
    const locationParam = searchParams.get("location") || "";

    setSelectedTopics(topicsParam ? topicsParam.split(",").map((s) => decodeURIComponent(s)) : []);
    setSelectedSources(sourcesParam ? sourcesParam.split(",").map((s) => decodeURIComponent(s)) : []);
    setSelectedTime(timeParam ? decodeURIComponent(timeParam) : "");
    setSelectedLocations(locationParam ? locationParam.split(",").map((s) => decodeURIComponent(s)) : []);
  };

  const pushFilters = (opts?: { clear?: boolean }) => {
    const sp = new URLSearchParams(searchParams);
    sp.delete("page"); // reset pagination
    sp.delete("source"); // legacy single-source param can override `sources`
    // Clear legacy/hidden filters that the UI does not control (can cause confusing empty results)
    sp.delete("platform");
    sp.delete("product");
    sp.delete("section");
    sp.delete("content");
    sp.delete("contentType");

    if (opts?.clear) {
      sp.delete("topics");
      sp.delete("sources");
      sp.delete("time");
      sp.delete("location");
      router.push(`?${sp.toString()}`);
      return;
    }

    const topicsToSend =
      selectedTopics.length === 0 || selectedTopics.includes("All Topics")
        ? []
        : selectedTopics;
    const sourcesToSend = selectedSources;
    const timeToSend = selectedTime;
    const locationsToSend = selectedLocations;

    if (topicsToSend.length > 0) sp.set("topics", topicsToSend.join(","));
    else sp.delete("topics");

    if (sourcesToSend.length > 0) sp.set("sources", sourcesToSend.join(","));
    else sp.delete("sources");

    if (timeToSend) sp.set("time", timeToSend);
    else sp.delete("time");

    if (locationsToSend.length > 0) sp.set("location", locationsToSend.join(","));
    else sp.delete("location");

    router.push(`?${sp.toString()}`);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      if (topic === "All Topics") {
        return prev.includes("All Topics") ? [] : ["All Topics"];
      }
      const next = prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev.filter((t) => t !== "All Topics"), topic];
      return next;
    });
  };

  const toggleSource = (source: string) => {
    setSelectedSources((prev) => (prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]));
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) => (prev.includes(loc) ? prev.filter((s) => s !== loc) : [...prev, loc]));
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
          ${open ? "w-[100%] p-4" : "w-[190px] p-2"}
        `}
      >
        {/* Button (collapsed state) */}
        {!open && (
          <button
            onClick={() => {
              syncFromUrl();
              setOpen(true);
            }}
            className={`
              flex items-center justify-center
              h-10
              px-3
              text-lg font-semibold
              bg-background hover:bg-purple-50 dark:hover:bg-purple-500/10
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
                      className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white absolute right-4 top-4"
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
                                ${
                                  active
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

                    {/* Dropdown menus - overflow-visible so slide-in isn't clipped */}
                    <div className="flex flex-col gap-2 overflow-visible">
                      {/* Source dropdown */}
                      <motion.div
                        initial={{ x: -60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={getSectionTransition(0)}
                        className="border border-purple-500/30 rounded-lg overflow-hidden bg-background"
                      >
                        <button
                          onClick={() => toggleDropdown("source")}
                          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:bg-purple-50/50 transition"
                        >
                          Sources
                          <ChevronDown
                            className={`size-4 transition-transform duration-300 ${openDropdowns.source ? "rotate-180" : ""}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {openDropdowns.source && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                opacity: { duration: 0.25 },
                                height: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                              }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 px-4 pb-4 pt-1 border-t border-purple-500/20">
                                {allSourceOptions.map((source, i) => (
                                  <motion.label
                                    key={source}
                                    initial={{ x: -24, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={getItemTransition(i)}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      className="accent-primary"
                                      checked={selectedSources.includes(source)}
                                      onChange={() => toggleSource(source)}
                                    />
                                    {source}
                                  </motion.label>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Time dropdown */}
                      <motion.div
                        initial={{ x: -60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={getSectionTransition(1)}
                        className="border border-purple-500/30 rounded-lg overflow-hidden bg-background"
                      >
                        <button
                          onClick={() => toggleDropdown("time")}
                          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:bg-purple-50/50 transition"
                        >
                          Time
                          <ChevronDown
                            className={`size-4 transition-transform duration-300 ${openDropdowns.time ? "rotate-180" : ""}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {openDropdowns.time && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                opacity: { duration: 0.25 },
                                height: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                              }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 px-4 pb-4 pt-1 border-t border-purple-500/20">
                                {["Last 24 hours", "Past week", "Past month", "Past year"].map((time, i) => (
                                  <motion.label
                                    key={time}
                                    initial={{ x: -24, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={getItemTransition(i)}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                  >
                                    <input
                                      type="radio"
                                      name="time"
                                      className="accent-primary"
                                      checked={selectedTime === time}
                                      onChange={() => setSelectedTime(time)}
                                    />
                                    {time}
                                  </motion.label>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Location dropdown */}
                      <motion.div
                        initial={{ x: -60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={getSectionTransition(2)}
                        className="border border-purple-500/30 rounded-lg overflow-hidden bg-background"
                      >
                        <button
                          onClick={() => toggleDropdown("location")}
                          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:bg-purple-50/50 transition"
                        >
                          Location
                          <ChevronDown
                            className={`size-4 transition-transform duration-300 ${openDropdowns.location ? "rotate-180" : ""}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {openDropdowns.location && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                opacity: { duration: 0.25 },
                                height: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                              }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 px-4 pb-4 pt-1 border-t border-purple-500/20">
                                {["United States", "Europe", "Asia", "Global"].map((loc, i) => (
                                  <motion.label
                                    key={loc}
                                    initial={{ x: -24, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={getItemTransition(i)}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      className="accent-primary"
                                      checked={selectedLocations.includes(loc)}
                                      onChange={() => toggleLocation(loc)}
                                    />
                                    {loc}
                                  </motion.label>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-8 flex items-center justify-between">
                    <button
                      className="text-sm text-muted-foreground hover:underline"
                      onClick={() => {
                        setSelectedTopics([]);
                        setSelectedSources([]);
                        setSelectedTime("");
                        setSelectedLocations([]);
                        pushFilters({ clear: true });
                      }}
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => {
                        pushFilters();
                        setOpen(false);
                      }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-blue-600 h-9 rounded-md px-3 readmore-btn relative z-1"
                    >
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
