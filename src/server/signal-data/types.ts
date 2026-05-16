import type { ApiFootballTeamContext, NewsArticle, Team } from "../../types/market";

export interface SignalDataReadOptions {
  teamId?: Team["id"];
  days?: number;
  limit?: number;
}

export interface SignalDataRepository {
  upsertNewsArticles(articles: NewsArticle[], collectedAt: string): Promise<void>;
  readNewsArticles(options?: SignalDataReadOptions): Promise<NewsArticle[]>;
  upsertFootballTeamContext(context: ApiFootballTeamContext[], collectedAt: string): Promise<void>;
  readFootballTeamContext(options?: { teamId?: Team["id"] }): Promise<ApiFootballTeamContext[]>;
  recordCollectionRun(run: SignalDataCollectionRun): Promise<void>;
  readSourceStats(): Promise<SignalDataSourceStats>;
}

export interface SignalDataCollectionRun {
  id: string;
  source: "gdelt" | "api-football";
  collectedAt: string;
  count: number;
  status: "ok" | "empty" | "error" | "skipped";
  errors?: string[];
}

export interface SignalDataSourceStats {
  news: {
    count: number;
    latestCollectedAt?: string;
    latestPublishedAt?: string;
    lastRun?: SignalDataCollectionRun;
  };
  football: {
    count: number;
    latestCollectedAt?: string;
    lastRun?: SignalDataCollectionRun;
  };
}
