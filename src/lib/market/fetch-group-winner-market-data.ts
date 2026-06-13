import "server-only";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { fetchPolymarketGamma } from "@/lib/market/polymarket-gamma-fetch";
import {
  fetchGroupWinnerGammaEvent,
  mapGroupWinnerEventToHeader,
  mapGroupWinnerEventToSnapshots,
  type GroupWinnerHeaderData,
} from "@/lib/market/map-group-winner-event";
import type { TeamMarketSnapshot } from "@/types/market";

export async function fetchGroupWinnerMarketData(
  group: WorldCup2026Group,
): Promise<
  | {
      snapshots: TeamMarketSnapshot[];
      header: GroupWinnerHeaderData;
    }
  | undefined
> {
  try {
    const event = await fetchGroupWinnerGammaEvent(group, (path, params) =>
      fetchPolymarketGamma(path, params),
    );

    if (!event) {
      return undefined;
    }

    return {
      snapshots: mapGroupWinnerEventToSnapshots(event, group),
      header: mapGroupWinnerEventToHeader(event, group),
    };
  } catch {
    return undefined;
  }
}
