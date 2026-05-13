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
}
