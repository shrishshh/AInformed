import Image from "next/image";
import type { Metadata } from "next";

// Force dynamic rendering to avoid prerender errors with API calls
export const dynamic = 'force-dynamic';

async function getArticle(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-news`, { cache: 'no-store' });
  const data = await res.json();
  const found = (data.articles || []).find((item: any) => encodeURIComponent(item.url) === id);
  return found || null;
}

interface NewsDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await getArticle(params.id);
  if (!article) {
    return {
      title: "Article Not Found | AInformed",
      description: "This article could not be found.",
    };
  }
  return {
    title: `${article.title} | AInformed` || "AI News Article | AInformed",
    description: article.description || article.summary || "Read the latest AI news on AInformed.",
    openGraph: {
      title: article.title,
      description: article.description || article.summary,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ainformed.app'}/news/${encodeURIComponent(article.url)}`,
      siteName: "AInformed",
      images: [
        {
          url: article.image || "/placeholder.svg",
          width: 800,
          height: 400,
          alt: article.title
        }
      ],
      locale: "en_US",
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description || article.summary,
      images: [article.image || "/placeholder.svg"],
      creator: "@ainformedapp"
    }
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const article = await getArticle(params.id);
  if (!article) {
    return <div className="container px-4 py-8 mx-auto"><p className="text-muted-foreground">Article not found.</p></div>;
  }
  return (
    <div className="container px-4 py-8 mx-auto max-w-3xl">
      <Image
        src={article.image || "/placeholder.svg"}
        alt={article.title}
        width={800}
        height={400}
        className="w-full h-64 object-cover rounded-lg mb-6"
        priority={true}
      />
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <div className="text-sm text-muted-foreground mb-4">
        {article.source?.name || article.source} &middot; {article.publishedAt}
      </div>
      <div className="prose prose-invert max-w-none">
        <p>{article.content || article.description}</p>
      </div>
    </div>
  );
} 