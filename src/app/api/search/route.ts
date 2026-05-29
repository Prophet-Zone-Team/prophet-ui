import { NextResponse, type NextRequest } from "next/server";

import { getFootballMatches } from "@/data/providers/football-matches";
import { getNewsArticleSlug } from "@/lib/news/news-slugs";
import { newsDetailHref } from "@/lib/routes/news";
import { teamTradeHref, gameTradeHref } from "@/lib/routes/trade";
import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { curatedVisibleTeamsList } from "@/data/teams/curated-team-list";
import { getSignalDataRepository } from "@/server/signal-data/repository";
import type { SearchResult, SearchResultType } from "@/types/market";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const type = (request.nextUrl.searchParams.get("type") ?? "all") as SearchResultType | "all";

  if (q.length < 2) {
    return NextResponse.json({ results: [], meta: { q, type, count: 0 } });
  }

  const normalized = q.toLowerCase();
  const [{ matches }, newsResults, footballContext] = await Promise.all([
    getFootballMatches(),
    searchNews(normalized, type),
    searchFootballContext(normalized, type),
  ]);
  const results = [
    ...searchTeams(normalized, type),
    ...searchMatches(normalized, type, matches),
    ...newsResults,
    ...footballContext,
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  return NextResponse.json({
    results,
    meta: {
      q,
      type,
      count: results.length,
    },
  });
}

function searchTeams(q: string, type: SearchResultType | "all"): SearchResult[] {
  if (type !== "all" && type !== "team" && type !== "market" && type !== "path") {
    return [];
  }

  return curatedVisibleTeamsList.flatMap((team) => {
    const text = `${team.name} ${team.code} ${team.region}`.toLowerCase();

    if (!text.includes(q)) {
      return [];
    }

    const exactBoost = team.name.toLowerCase() === q || team.code.toLowerCase() === q ? 40 : 0;
    const baseScore = 80 + exactBoost;

    return [
      {
        id: `team:${team.id}`,
        type: "team",
        title: team.name,
        subtitle: `${team.code} / ${team.region}`,
        href: teamTradeHref(team.id),
        score: baseScore,
      },
      {
        id: `market:${team.id}`,
        type: "market",
        title: `${team.name} winner market`,
        subtitle: "Open team market trade ticket",
        href: teamTradeHref(team.id),
        score: baseScore - 5,
      },
      {
        id: `path:${team.id}`,
        type: "path",
        title: `${team.name} Road to Final`,
        subtitle: "Explore possible knockout path",
        href: `/world-cup/path-explorer?team=${team.id}`,
        score: baseScore - 8,
      },
    ] satisfies SearchResult[];
  }).filter((result) => type === "all" || result.type === type);
}

function searchMatches(
  q: string,
  type: SearchResultType | "all",
  matches: Awaited<ReturnType<typeof getFootballMatches>>["matches"],
): SearchResult[] {
  if (type !== "all" && type !== "match") {
    return [];
  }

  return matches.flatMap((match) => {
    const home = match.homeTeamId ? getWorldCupTeamByIdOrCode(match.homeTeamId) : undefined;
    const away = match.awayTeamId ? getWorldCupTeamByIdOrCode(match.awayTeamId) : undefined;
    const homeName = home?.name ?? match.homeDisplayName ?? match.homeSeed ?? "";
    const awayName = away?.name ?? match.awayDisplayName ?? match.awaySeed ?? "";
    const text = `${match.matchId} ${match.group ?? ""} ${match.stage} ${match.league ?? ""} ${homeName} ${awayName}`.toLowerCase();

    if (!text.includes(q)) {
      return [];
    }

    return {
      id: `match:${match.id}`,
      type: "match",
      title: homeName && awayName ? `${homeName} vs ${awayName}` : `Match ${match.matchId}`,
      subtitle: match.league ?? `${match.stage}${match.group ? ` / Group ${match.group}` : ""}`,
      href: gameTradeHref(match.id),
      score: 70,
    } satisfies SearchResult;
  });
}

async function searchNews(q: string, type: SearchResultType | "all"): Promise<SearchResult[]> {
  if (type !== "all" && type !== "news") {
    return [];
  }

  const repository = await getSignalDataRepository();
  const articles = await repository.readNewsArticles({ days: 90, limit: 80 });

  return articles.flatMap((article) => {
    const text = `${article.title} ${article.source ?? ""} ${article.snippet ?? ""} ${article.matchedKeywords.join(" ")}`.toLowerCase();

    if (!text.includes(q)) {
      return [];
    }

    return {
      id: `news:${article.id}`,
      type: "news",
      title: article.title,
      subtitle: article.source ?? "World Cup news",
      href: newsDetailHref(getNewsArticleSlug(article)),
      score: 60,
    } satisfies SearchResult;
  });
}

async function searchFootballContext(q: string, type: SearchResultType | "all"): Promise<SearchResult[]> {
  if (type !== "all" && type !== "team") {
    return [];
  }

  const repository = await getSignalDataRepository();
  const contexts = await repository.readFootballTeamContext();

  return contexts.flatMap((context) => {
    const clubHits = context.squad.filter((player) => {
      const club = "club" in player && typeof player.club === "string" ? player.club : "";
      return club.toLowerCase().includes(q);
    });

    if (clubHits.length === 0) {
      return [];
    }

    return {
      id: `club-context:${context.profile.teamId}`,
      type: "team",
      title: `${context.profile.name} squad context`,
      subtitle: `Club match: ${clubHits.slice(0, 2).map((player) => player.name).join(", ")}`,
      href: teamTradeHref(context.profile.teamId),
      score: 45,
    } satisfies SearchResult;
  });
}
