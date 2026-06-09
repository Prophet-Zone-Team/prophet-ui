import type { NewsArticle, Team } from "@/types/market";

export interface TeamNewsQuery {
  teamId: Team["id"];
  teamName: string;
  aliases: string[];
  countryAliases: string[];
  keyPlayers: string[];
  excludeTerms: string[];
  contextKeywords: string[];
  startDate: Date;
  endDate: Date;
  maxArticles?: number;
}

export interface NewsProvider {
  searchRecentTeamNews(query: TeamNewsQuery): Promise<NewsArticle[]>;
  searchRecentWorldCupNews?(queries: TeamNewsQuery[]): Promise<NewsArticle[]>;
}
