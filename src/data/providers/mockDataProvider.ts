import {
  mockNewsEvents,
  mockProbabilityHistory,
  mockTeamMarketSnapshots,
} from "../mock/teams";
import type { WorldCupMarketData, WorldCupMarketDataProvider } from "./types";

export const mockDataProvider: WorldCupMarketDataProvider = {
  async getWorldCupMarketData(): Promise<WorldCupMarketData> {
    const lastUpdated = mockTeamMarketSnapshots.reduce((latest, snapshot) => {
      return snapshot.market.updatedAt > latest ? snapshot.market.updatedAt : latest;
    }, mockTeamMarketSnapshots[0]?.market.updatedAt ?? new Date(0).toISOString());

    return {
      snapshots: mockTeamMarketSnapshots,
      newsEvents: mockNewsEvents,
      probabilityHistory: mockProbabilityHistory,
      meta: {
        source: "mock",
        status: "fallback",
        lastUpdated,
        stale: true,
      },
    };
  },
};
