import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { ApiFootballTeamContext, NewsArticle } from "../../types/market";
import type { SignalDataCollectionRun, SignalDataReadOptions, SignalDataRepository } from "./types";

const SIGNAL_DATA_FILE_PATH = join(process.cwd(), ".data", "signal-data.json");

interface SignalDataFile {
  newsArticles: NewsArticle[];
  footballTeamContext: ApiFootballTeamContext[];
  collectionRuns: SignalDataCollectionRun[];
}

export const fileSignalDataRepository: SignalDataRepository = {
  async upsertNewsArticles(articles: NewsArticle[]): Promise<void> {
    if (articles.length === 0) {
      return;
    }

    const data = await readSignalData();
    const byId = new Map(data.newsArticles.map((article) => [article.id, article]));

    for (const article of articles) {
      byId.set(article.id, article);
    }

    await writeSignalData({
      ...data,
      newsArticles: [...byId.values()].sort(compareNewsArticles),
    });
  },

  async readNewsArticles(options: SignalDataReadOptions = {}): Promise<NewsArticle[]> {
    const data = await readSignalData();
    const cutoff = getCutoffDate(options.days);

    return data.newsArticles
      .filter((article) => !options.teamId || article.matchedTeamIds.includes(options.teamId))
      .filter((article) => !cutoff || !article.publishedAt || new Date(article.publishedAt) >= cutoff)
      .sort(compareNewsArticles)
      .slice(0, options.limit ?? 80);
  },

  async upsertFootballTeamContext(context: ApiFootballTeamContext[]): Promise<void> {
    if (context.length === 0) {
      return;
    }

    const data = await readSignalData();
    const byTeamId = new Map(data.footballTeamContext.map((teamContext) => [teamContext.profile.teamId, teamContext]));

    for (const teamContext of context) {
      byTeamId.set(teamContext.profile.teamId, teamContext);
    }

    await writeSignalData({
      ...data,
      footballTeamContext: [...byTeamId.values()],
    });
  },

  async readFootballTeamContext(options: { teamId?: string } = {}): Promise<ApiFootballTeamContext[]> {
    const data = await readSignalData();

    return data.footballTeamContext.filter(
      (teamContext) => !options.teamId || teamContext.profile.teamId === options.teamId,
    );
  },

  async recordCollectionRun(run: SignalDataCollectionRun): Promise<void> {
    const data = await readSignalData();
    const byId = new Map(data.collectionRuns.map((item) => [item.id, item]));
    byId.set(run.id, run);

    await writeSignalData({
      ...data,
      collectionRuns: [...byId.values()]
        .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))
        .slice(0, 80),
    });
  },

  async readSourceStats() {
    const data = await readSignalData();
    const newsLastRun = data.collectionRuns.find((run) => run.source === "gdelt");
    const footballLastRun = data.collectionRuns.find((run) => run.source === "api-football");

    return {
      news: {
        count: data.newsArticles.length,
        latestPublishedAt: data.newsArticles.reduce<string | undefined>((latest, article) => {
          if (!article.publishedAt) {
            return latest;
          }

          return !latest || article.publishedAt > latest ? article.publishedAt : latest;
        }, undefined),
        lastRun: newsLastRun,
      },
      football: {
        count: data.footballTeamContext.length,
        latestCollectedAt: data.footballTeamContext.reduce<string | undefined>((latest, teamContext) => {
          const updatedAt = teamContext.profile.updatedAt;
          return !latest || updatedAt > latest ? updatedAt : latest;
        }, undefined),
        lastRun: footballLastRun,
      },
    };
  },
};

async function readSignalData(): Promise<SignalDataFile> {
  try {
    const raw = await readFile(SIGNAL_DATA_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<SignalDataFile>;

      return {
        newsArticles: Array.isArray(parsed.newsArticles) ? parsed.newsArticles.filter(isNewsArticle) : [],
        footballTeamContext: Array.isArray(parsed.footballTeamContext)
          ? parsed.footballTeamContext.map(normalizeTeamContext)
          : [],
        collectionRuns: Array.isArray(parsed.collectionRuns) ? parsed.collectionRuns.filter(isCollectionRun) : [],
      };
  } catch (error) {
    if (isNotFoundError(error)) {
      return {
        newsArticles: [],
        footballTeamContext: [],
        collectionRuns: [],
      };
    }

    throw error;
  }
}

function isCollectionRun(value: unknown): value is SignalDataCollectionRun {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const run = value as Partial<SignalDataCollectionRun>;
  return (
    typeof run.id === "string" &&
    (run.source === "gdelt" || run.source === "api-football") &&
    typeof run.collectedAt === "string" &&
    typeof run.count === "number"
  );
}

function normalizeTeamContext(teamContext: ApiFootballTeamContext): ApiFootballTeamContext {
  return {
    profile: teamContext.profile,
    fixtures: teamContext.fixtures ?? [],
    squad: teamContext.squad ?? [],
    injuries: teamContext.injuries ?? [],
    standings: teamContext.standings ?? [],
    odds: teamContext.odds ?? [],
    dataIssues: teamContext.dataIssues ?? [],
  };
}

async function writeSignalData(data: SignalDataFile): Promise<void> {
  await mkdir(dirname(SIGNAL_DATA_FILE_PATH), { recursive: true });
  const tempPath = `${SIGNAL_DATA_FILE_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tempPath, SIGNAL_DATA_FILE_PATH);
}

function compareNewsArticles(a: NewsArticle, b: NewsArticle): number {
  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
}

function getCutoffDate(days: number | undefined): Date | undefined {
  if (!days || days <= 0) {
    return undefined;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

function isNewsArticle(value: unknown): value is NewsArticle {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const article = value as Partial<NewsArticle>;
  return typeof article.id === "string" && typeof article.title === "string" && typeof article.url === "string";
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
