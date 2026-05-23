import { NextResponse, type NextRequest } from "next/server";

import { getNewsArticleSlug } from "@/lib/news/news-slugs";
import { getSignalDataRepository } from "@/server/signal-data/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repository = await getSignalDataRepository();
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase();
  const days = toPositiveNumber(request.nextUrl.searchParams.get("days")) ?? 60;
  const limit = toPositiveNumber(request.nextUrl.searchParams.get("limit")) ?? 50;
  const articles = await repository.readNewsArticles({ teamId, days, limit: Math.min(limit, 100) });
  const filtered = q
    ? articles.filter((article) => {
        const text = `${article.title} ${article.source ?? ""} ${article.snippet ?? ""} ${article.matchedKeywords.join(" ")}`.toLowerCase();
        return text.includes(q);
      })
    : articles;

  return NextResponse.json({
    articles: filtered.map((article) => ({
      ...article,
      slug: getNewsArticleSlug(article),
    })),
    meta: {
      source: "gdelt-cache",
      count: filtered.length,
      teamId,
      days,
    },
  });
}

function toPositiveNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
