import { MetadataRoute } from "next";
import { getApiUrl, getFullUrl } from '@/lib/url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.ainformed.in";

  // 1. Fetch dynamic articles from your API
  let articles: any[] = [];
  
  try {
    const apiUrl = getApiUrl('/api/ai-news');
    const res = await fetch(apiUrl, { 
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (res.ok) {
      const data = await res.json();
      articles = data.articles || [];
      console.log(`✅ Fetched ${articles.length} articles for sitemap`);
    } else {
      console.error(`❌ API error: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error("❌ Failed to fetch articles for sitemap:", error);
  }

  // 2. Convert articles to sitemap format
  // Your articles use URL as the ID, and routes use encodeURIComponent(url)
  const dynamicNewsUrls = articles.map((article: any) => ({
    url: `${baseUrl}/news/${encodeURIComponent(article.url || '')}`,
    lastModified: article.publishedAt 
      ? new Date(article.publishedAt) 
      : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // 3. Add category pages (from your categories list)
  const categories = [
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

  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/categories/${encodeURIComponent(category)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // 4. Static pages with appropriate priorities
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ai-tools`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/research-papers`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  // 5. Combine all URLs
  return [...staticUrls, ...categoryUrls, ...dynamicNewsUrls];
}