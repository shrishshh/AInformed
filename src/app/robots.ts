import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",           // Block API routes
        "/auth/",          // Block auth pages
        "/bookmarks",      // Block private bookmarks
        "/saved",          // Block private saved items
        "/redirect",       // Block redirect pages
      ],
    },
    sitemap: "https://www.ainformed.in/sitemap.xml",
  };
}
