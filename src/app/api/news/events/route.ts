import { NextResponse, type NextRequest } from "next/server";

import { getSignalDataRepository } from "@/server/signal-data/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repository = await getSignalDataRepository();
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const days = toPositiveNumber(request.nextUrl.searchParams.get("days")) ?? 30;
  const limit = toPositiveNumber(request.nextUrl.searchParams.get("limit")) ?? 80;
  const articles = await repository.readNewsArticles({ teamId, days, limit });

  return NextResponse.json({
    articles,
    meta: {
      source: "gdelt-cache",
      count: articles.length,
      days,
      teamId,
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
