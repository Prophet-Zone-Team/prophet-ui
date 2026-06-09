import {
  mockNewsEvents,
  mockProbabilityHistory,
  mockTeamMarketSnapshots,
} from "@/data/mock/teams";
import { getAllTeamFootballMetadata } from "@/data/teams/football-metadata";
import type { WorldCupMarketData, WorldCupMarketDataProvider } from "@/data/providers/types";

export const mockDataProvider: WorldCupMarketDataProvider = {
  async getWorldCupMarketData(): Promise<WorldCupMarketData> {
    const lastUpdated = mockTeamMarketSnapshots.reduce((latest, snapshot) => {
      return snapshot.market.updatedAt > latest ? snapshot.market.updatedAt : latest;
    }, mockTeamMarketSnapshots[0]?.market.updatedAt ?? new Date(0).toISOString());

    return {
      snapshots: mockTeamMarketSnapshots,
      newsEvents: mockNewsEvents,
      probabilityHistory: mockProbabilityHistory,
      footballContext: [],
      footballTeamContext: [],
      footballMetadata: getAllTeamFootballMetadata(),
      meta: {
        source: "mock",
        status: "fallback",
        lastUpdated,
        stale: true,
        news: {
          source: "mock",
          status: "mock",
          articleCount: mockNewsEvents.length,
          lastUpdated: mockNewsEvents[0]?.publishedAt,
        },
      },
    };
  },
};
