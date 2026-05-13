import type { NewsArticle } from "../../types/market";
import type { NewsProvider, TeamNewsQuery } from "./types";

const GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const DEFAULT_MAX_ARTICLES = 4;
const REQUEST_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 5 * 60 * 1000;

const articleCache = new Map<string, { expiresAt: number; articles: GdeltArticle[] }>();

interface GdeltDocResponse {
  articles?: GdeltArticle[];
}

interface GdeltArticle {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  sourceCountry?: string;
  language?: string;
}

export const gdeltNewsProvider: NewsProvider = {
  async searchRecentTeamNews(query: TeamNewsQuery): Promise<NewsArticle[]> {
    const data = await fetchGdeltArticles(buildGdeltUrl(query));

    return dedupeArticles(data.map((article) => mapArticle(article, [query])).filter(isNewsArticle)).slice(
      0,
      query.maxArticles ?? DEFAULT_MAX_ARTICLES,
    );
  },

  async searchRecentWorldCupNews(queries: TeamNewsQuery[]): Promise<NewsArticle[]> {
    if (queries.length === 0) {
      return [];
    }

    const data = await fetchGdeltArticles(buildCombinedGdeltUrl(queries));
    return dedupeArticles(data.map((article) => mapArticle(article, queries)).filter(isNewsArticle));
  },
};

async function fetchGdeltArticles(url: URL): Promise<GdeltArticle[]> {
  const cacheKey = url.toString();
  const cached = articleCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.articles;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(url, {
    cache: "no-store",
    signal: controller.signal,
    headers: {
      accept: "application/json",
    },
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`GDELT DOC API returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as GdeltDocResponse;

  const articles = Array.isArray(data.articles) ? data.articles : [];
  articleCache.set(cacheKey, {
    articles,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return articles;
}

function buildGdeltUrl(query: TeamNewsQuery): URL {
  const url = new URL(GDELT_DOC_URL);
  url.searchParams.set("query", buildQueryText(query));
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "HybridRel");
  url.searchParams.set("maxrecords", String(Math.max(query.maxArticles ?? DEFAULT_MAX_ARTICLES, 8)));
  url.searchParams.set("timespan", getTimespan(query.startDate, query.endDate));

  return url;
}

function buildCombinedGdeltUrl(queries: TeamNewsQuery[]): URL {
  const [firstQuery] = queries;
  const url = new URL(GDELT_DOC_URL);
  url.searchParams.set("query", buildCombinedQueryText(queries));
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "HybridRel");
  url.searchParams.set("maxrecords", String(Math.max(queries.length * 4, 20)));
  url.searchParams.set("timespan", getTimespan(firstQuery.startDate, firstQuery.endDate));

  return url;
}

function buildQueryText(query: TeamNewsQuery): string {
  const aliases = uniqueTerms([query.teamName, ...query.aliases])
    .slice(0, 5)
    .map(quoteTerm);
  const players = uniqueTerms(query.keyPlayers).slice(0, 4).map(quoteTerm);
  const context = uniqueTerms(query.contextKeywords).slice(0, 5).map(quoteTerm);
  const excluded = uniqueTerms(query.excludeTerms).map((term) => `-${quoteTerm(term)}`);
  const identityTerms = [...aliases, ...players].join(" OR ");
  const contextTerms = context.join(" OR ");

  return `(${identityTerms}) (${contextTerms}) ${excluded.join(" ")}`.trim();
}

function buildCombinedQueryText(queries: TeamNewsQuery[]): string {
  const teamTerms = uniqueTerms(
    queries.flatMap((query) => [query.teamName, ...query.aliases.slice(0, 2), ...query.keyPlayers.slice(0, 1)]),
  )
    .slice(0, 32)
    .map(quoteTerm);
  const context = uniqueTerms(queries[0].contextKeywords)
    .filter((term) => ["football", "soccer"].includes(term.toLowerCase()))
    .slice(0, 3)
    .map(quoteTerm);
  const excluded = uniqueTerms(queries.flatMap((query) => query.excludeTerms)).map((term) => `-${quoteTerm(term)}`);

  return `(football OR soccer) (${context.join(" OR ")}) (${teamTerms.join(" OR ")}) ${excluded.join(" ")}`.trim();
}

function mapArticle(article: GdeltArticle, queries: TeamNewsQuery[]): NewsArticle | undefined {
  const url = article.url ?? article.url_mobile;
  const title = article.title?.trim();

  if (!url || !title) {
    return undefined;
  }

  const searchableText = `${title} ${url}`;
  const matchedQueries = queries
    .map((query) => ({
      query,
      keywords: getMatchedKeywords(searchableText, query),
    }))
    .filter((match) => match.keywords.length > 0);

  if (matchedQueries.length === 0) {
    return undefined;
  }

  const matchedKeywords = uniqueTerms(matchedQueries.flatMap((match) => match.keywords));

  return {
    id: createArticleId(url),
    title,
    url,
    source: article.domain,
    publishedAt: parseGdeltSeenDate(article.seendate),
    language: article.language,
    matchedTeamIds: matchedQueries.map((match) => match.query.teamId),
    matchedKeywords,
  };
}

function getMatchedKeywords(text: string, query: TeamNewsQuery): string[] {
  const normalizedText = normalizeText(text);
  const candidates = uniqueTerms([
    query.teamName,
    ...query.aliases,
    ...query.countryAliases,
    ...query.keyPlayers,
    ...query.contextKeywords,
  ]);

  return candidates.filter((term) => normalizedText.includes(normalizeText(term))).slice(0, 8);
}

function dedupeArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = normalizeUrl(article.url);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isNewsArticle(article: NewsArticle | undefined): article is NewsArticle {
  return Boolean(article);
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();

  return terms
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => {
      const key = normalizeText(term);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function quoteTerm(term: string): string {
  return term.includes(" ") ? `"${term}"` : term;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return value;
  }
}

function createArticleId(url: string): string {
  let hash = 0;

  for (const char of url) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return `gdelt-${hash.toString(36)}`;
}

function parseGdeltSeenDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const directDate = new Date(value);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString();
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length < 14) {
    return undefined;
  }

  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  const hour = digits.slice(8, 10);
  const minute = digits.slice(10, 12);
  const second = digits.slice(12, 14);
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function getTimespan(startDate: Date, endDate: Date): string {
  const hours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 3_600_000));

  if (hours >= 24 * 28) {
    return "1month";
  }

  if (hours % 24 === 0) {
    return `${hours / 24}d`;
  }

  return `${hours}h`;
}
