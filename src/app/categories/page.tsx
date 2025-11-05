"use client"

import { useRouter } from "next/navigation";
import { CategoryTabs } from "@/components/category-tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SpotlightCard from "@/components/SpotlightCard";
import Image from "next/image";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    "Automation",
  ];

  const categoryImages: Record<string, string> = {
    // Local images from /public requested by user
    "Artificial Intelligence": "/ASI-ANI-AGI-types-of-AI-1280x720.jpg",
    "Machine Learning": "/Machine-Learning-Basics.jpg",
    "Deep Learning": "/Dongang_Machine Learning_Theme Image-min_1.webp",
    "Natural Language Processing": "/shutterstock_2317041353.webp",
    "Computer Vision": "/39df04f3-6712-4d1a-a840-bbfd4f5152d0_computer+vision.avif",
    "Robotics": "/efc290acf4d2f1573b4a87aa3999508b.png",
    "Data Science": "/Career-In-Data-Science.webp",
    "Cybersecurity": "/cybersecurity_NicoElNino-AlamyStockPhoto.jpg",
    "Quantum Computing": "/CBcmkyZ8v4tAc8PSDcEgvM.jpg",
    "AI Ethics": "/News_Image_-_2024-01-22T102627.569.png",
    "Neural Networks": "/Neural_Networks.webp",
    "Automation": "/Automation-image-for-blog-article.jpg",
  };

  const categoryWikipediaUrls: Record<string, string> = {
    "Artificial Intelligence": "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "Machine Learning": "https://en.wikipedia.org/wiki/Machine_learning",
    "Deep Learning": "https://en.wikipedia.org/wiki/Deep_learning",
    "Natural Language Processing": "https://en.wikipedia.org/wiki/Natural_language_processing",
    "Computer Vision": "https://en.wikipedia.org/wiki/Computer_vision",
    "Robotics": "https://en.wikipedia.org/wiki/Robotics",
    "Data Science": "https://en.wikipedia.org/wiki/Data_science",
    "Cybersecurity": "https://en.wikipedia.org/wiki/Computer_security",
    "Quantum Computing": "https://en.wikipedia.org/wiki/Quantum_computing",
    "AI Ethics": "https://en.wikipedia.org/wiki/Ethics_of_artificial_intelligence",
    "Neural Networks": "https://en.wikipedia.org/wiki/Artificial_neural_network",
    "Automation": "https://en.wikipedia.org/wiki/Automation",
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
          <SpotlightCard key={category} className="custom-spotlight-card" spotlightColor="rgba(0, 229, 255, 0.15)">
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:shadow-xl transition-shadow duration-300 h-full bg-card">
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
              <CardContent className="w-full">
                <div className="flex items-center justify-between gap-2 mt-4">
                  <Link href={`/categories/${encodeURIComponent(category)}`} className="flex-1">
                    <Button variant="secondary" className="w-full text-xs">
                      View Articles
                    </Button>
                  </Link>
                  <a
                    href={categoryWikipediaUrls[category] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!categoryWikipediaUrls[category]) {
                        e.preventDefault();
                      }
                    }}
                    className="flex-1"
                  >
                    <Button variant="secondary" className="w-full text-xs">
                      Learn More
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
} 