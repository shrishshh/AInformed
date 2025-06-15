"use client"

import { useRouter } from "next/navigation";
import { CategoryTabs } from "@/components/category-tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
        <CategoryTabs onCategoryChange={handleCategoryChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTechCategories.map((category) => (
          <Link key={category} href={`/categories/${encodeURIComponent(category)}`} passHref>
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:shadow-xl transition-shadow duration-300 h-full cursor-pointer bg-card">
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
          </Link>
        ))}
      </div>
    </div>
  );
} 