"use client"

import { useRouter } from "next/navigation";
import { CategoryTabs } from "@/components/category-tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import SpotlightCard from "@/components/SpotlightCard";
import Image from "next/image";

export default function CategoriesIndexPage() {
  const router = useRouter();

  // Categories are hardcoded in CategoryTabs now, so we can get them from there
  // or define a similar list here for display. For simplicity, let's list them directly.
  const allTechCategories = [
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

  const categoryImages: Record<string, string> = {
    "Artificial Intelligence": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80&sig=ai",
    "Machine Learning": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80&sig=ml",
    "Deep Learning": "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80&sig=dl",
    "Natural Language Processing": "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80&sig=nlp",
    "Computer Vision": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80&sig=cv",
    "Robotics": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80&sig=robotics",
    "Data Science": "https://images.unsplash.com/photo-1467987506553-8f3916508521?auto=format&fit=crop&w=600&q=80&sig=data",
    "Cybersecurity": "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=600&q=80&sig=cybersecurity",
    "Quantum Computing": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80&sig=quantum",
    "AI Ethics": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80&sig=ethics",
    "Neural Networks": "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80&sig=neural",
    "Big Data": "https://images.unsplash.com/photo-1467987506553-8f3916508521?auto=format&fit=crop&w=600&q=80&sig=bigdata",
    "Automation": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80&sig=automation",
  };

  const handleCategoryChange = (category: string) => {
    // If "All" is selected, we might want to go to the home page or a general AI news page.
    // For now, let's route to a general categories view or a default if "All" is selected.
    // If a specific category is selected, route to its dynamic page.
    if (category === "All") {
      router.push(`/`); // Or `/categories/all` if you want a specific "All" category page
    } else {
      router.push(`/categories/${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-4">Explore AI & Tech Categories</h1>
      <p className="text-muted-foreground mb-8">
        Dive deeper into specific areas of artificial intelligence and technology.
      </p>

      <div className="mb-6">
        {/* CategoryTabs removed as requested */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTechCategories.map((category) => (
          <Link key={category} href={`/categories/${encodeURIComponent(category)}`} passHref>
            <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(0, 229, 255, 0.15)">
              <Card className="flex flex-col items-center justify-center p-6 text-center hover:shadow-xl transition-shadow duration-300 h-full cursor-pointer bg-card">
                <div className="relative w-full aspect-[16/9] mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={categoryImages[category] || "/placeholder.svg"}
                    alt={category}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold mb-2">{category}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Latest news and insights in {category}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="mt-4 px-3 py-1 text-xs">View Articles</Badge>
                </CardContent>
              </Card>
            </SpotlightCard>
          </Link>
        ))}
      </div>
    </div>
  );
} 