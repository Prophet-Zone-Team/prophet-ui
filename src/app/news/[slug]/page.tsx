import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NewsDetailPage } from "@/components/news/news-page";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { findNewsArticleBySlug } from "@/lib/news/news-slugs";
import { getSignalDataRepository } from "@/server/signal-data/repository";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = await getSignalDataRepository();
  const article = findNewsArticleBySlug(await repository.readNewsArticles({ days: 120, limit: 200 }), slug);

  if (!article) {
    return {
      title: "World Cup News | Prophet",
    };
  }

  return {
    title: `${article.title} | Prophet`,
    description: article.snippet ?? "World Cup news context for market analysis.",
    alternates: {
      canonical: `/news/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.snippet ?? "World Cup news context for market analysis.",
      type: "article",
      url: `/news/${slug}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const [marketData, repository] = await Promise.all([
    getWorldCupMarketData({ includeFootballContext: false }),
    getSignalDataRepository(),
  ]);
  const article = findNewsArticleBySlug(await repository.readNewsArticles({ days: 120, limit: 200 }), slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            datePublished: article.publishedAt,
            publisher: article.source ? { "@type": "Organization", name: article.source } : undefined,
            url: article.url,
          }),
        }}
      />
      <NewsDetailPage article={article} snapshots={marketData.snapshots} />
    </>
  );
}
