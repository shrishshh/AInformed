"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// interface CategoryTabsProps {
//   categories: string[]
//   onCategoryChange: (category: string) => void
// }

export function CategoryTabs({ onCategoryChange }: { onCategoryChange: (category: string) => void }) {
  const categories = [
    "All",
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
    "Big Data",
    "Automation",
  ];

  const [activeCategory, setActiveCategory] = useState("All")

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    onCategoryChange(category)
  }

  return (
    <div className="w-full overflow-auto pb-2 mb-6">
      <Tabs defaultValue="All" className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-fit min-w-full sm:min-w-0">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm h-8 rounded-sm px-3 whitespace-nowrap"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
