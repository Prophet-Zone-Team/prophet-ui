import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NewsDetailPage, NewsPage } from "@/components/news/news-page";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { findNewsArticleBySlug } from "@/lib/news/news-slugs";
import { newsDetailHref } from "@/lib/routes/news";
import { getSignalDataRepository } from "@/server/signal-data/repository";

interface PageProps {
  searchParams: Promise<{
    slug?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await searchParams;

  if (!slug) {
    return {
      title: "World Cup News Context | Prophet",
      description: "World Cup team news context, market signals, and related source links.",
      alternates: {
        canonical: "/news",
      },
    };
  }

  const repository = await getSignalDataRepository();
  const article = findNewsArticleBySlug(await repository.readNewsArticles({ days: 120, limit: 200 }), slug);

  if (!article) {
    return {
      title: "World Cup News | Prophet",
    };
  }

  const canonical = newsDetailHref(slug);

  return {
    title: `${article.title} | Prophet`,
    description: article.snippet ?? "World Cup news context for market analysis.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: article.title,
      description: article.snippet ?? "World Cup news context for market analysis.",
      type: "article",
      url: canonical,
    },
  };
}

export default async function Page({ searchParams }: PageProps) {
  const { slug } = await searchParams;
  const [marketData, repository] = await Promise.all([
    getWorldCupMarketData({ includeFootballContext: false }),
    getSignalDataRepository(),
  ]);

  if (slug) {
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

  const articles = await repository.readNewsArticles({ days: 90, limit: 80 });

  return <NewsPage articles={articles} snapshots={marketData.snapshots} />;
}
