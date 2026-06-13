import {
  resolveGroupWinnerEventPath,
  resolveGroupWinnerEventSlug,
} from "@/config/fifa-group-winner-market";
import {
  WORLD_CUP_2026_GROUPS,
  type WorldCup2026Group,
} from "@/data/world-cup-2026/groups";
import { firstGammaNumber, isGammaEventRecord, type GammaEventRecord } from "@/lib/market/polymarket-gamma";
import { resolveWorldCupTeamByCuratedKey } from "@/lib/market/resolve-winner-team";
import {
  mapWinnerEventToStorePatch,
  type WinnerTeamMarketDynamic,
} from "@/lib/market/winner-event-mapper";
import type { TeamMarketSnapshot } from "@/types/market";

const PLACEHOLDER_UPDATED_AT = "1970-01-01T00:00:00.000Z";
const DEFAULT_GROUP_STAGE_DATE_RANGE = "June 11 – June 27, 2026";

export interface GroupWinnerHeaderData {
  title: string;
  dateRange: string;
  volume: number;
  slug: string;
}

export function parseGroupWinnerGammaEventResponse(
  payload: unknown,
  expectedSlug?: string,
): GammaEventRecord | undefined {
  const normalizedSlug = expectedSlug?.trim().toLowerCase();

  if (isGammaEventRecord(payload)) {
    if (
      normalizedSlug &&
      payload.slug?.trim().toLowerCase() !== normalizedSlug
    ) {
      return undefined;
    }

    return payload;
  }

  if (Array.isArray(payload)) {
    if (normalizedSlug) {
      const matched = payload.find(
        (item) =>
          isGammaEventRecord(item) &&
          item.slug?.trim().toLowerCase() === normalizedSlug,
      );

      if (matched) {
        return matched;
      }
    }

    return payload.find(isGammaEventRecord);
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: unknown }).data !== undefined
  ) {
    return parseGroupWinnerGammaEventResponse(
      (payload as { data?: unknown }).data,
      expectedSlug,
    );
  }

  return undefined;
}

export async function fetchGroupWinnerGammaEvent(
  group: WorldCup2026Group,
  fetcher: (
    path: string,
    params?: Record<string, string>,
  ) => Promise<unknown>,
): Promise<GammaEventRecord | undefined> {
  const slug = resolveGroupWinnerEventSlug(group);

  try {
    const bySlugPath = await fetcher(resolveGroupWinnerEventPath(group));
    const parsedFromSlugPath = parseGroupWinnerGammaEventResponse(
      bySlugPath,
      slug,
    );

    if (parsedFromSlugPath) {
      return parsedFromSlugPath;
    }
  } catch {
    // Fall through to query-param endpoint.
  }

  try {
    const byQuery = await fetcher("/events", { slug });
    return parseGroupWinnerGammaEventResponse(byQuery, slug);
  } catch {
    return undefined;
  }
}

export function buildStaticGroupSnapshots(
  group: WorldCup2026Group,
): TeamMarketSnapshot[] {
  return WORLD_CUP_2026_GROUPS[group].flatMap((wcTeam) => {
    const team =
      resolveWorldCupTeamByCuratedKey(wcTeam.id) ??
      resolveWorldCupTeamByCuratedKey(wcTeam.name);

    if (!team) {
      return [];
    }

    return [
      {
        team: { ...team, group },
        market: {
          teamId: team.id,
          probability: 0,
          change24h: 0,
          change7d: 0,
          volume: 0,
          sentiment: "neutral",
          bookmakerImpliedProbability: 0,
          updatedAt: PLACEHOLDER_UPDATED_AT,
        },
      },
    ];
  });
}

export function mergeGroupWinnerSnapshots(
  group: WorldCup2026Group,
  byTeamId: Record<string, WinnerTeamMarketDynamic>,
): TeamMarketSnapshot[] {
  const merged = buildStaticGroupSnapshots(group).map((snapshot) => {
    const dynamic = byTeamId[snapshot.team.id];

    if (!dynamic) {
      return snapshot;
    }

    return {
      team: snapshot.team,
      market: {
        teamId: snapshot.team.id,
        ...dynamic,
      },
    };
  });

  return merged.sort(
    (left, right) => right.market.probability - left.market.probability,
  );
}

export function mapGroupWinnerEventToSnapshots(
  event: GammaEventRecord,
  group: WorldCup2026Group,
): TeamMarketSnapshot[] {
  const patch = mapWinnerEventToStorePatch(event);
  return mergeGroupWinnerSnapshots(group, patch.byTeamId);
}

export function resolveDefaultSelectedTeamId(
  snapshots: TeamMarketSnapshot[],
): string | undefined {
  return snapshots[0]?.team.id;
}

export function mapGroupWinnerEventToHeader(
  event: GammaEventRecord,
  group: WorldCup2026Group,
): GroupWinnerHeaderData {
  return {
    title: event.title?.trim() || `Group ${group}`,
    dateRange: resolveGroupStageDateRange(event),
    volume:
      firstGammaNumber(
        event.volume,
        event.volumeNum,
        event.volume24hr,
      ) ?? 0,
    slug: event.slug?.trim() || resolveGroupWinnerEventSlug(group),
  };
}

function resolveGroupStageDateRange(event: GammaEventRecord): string {
  const description = event.description ?? "";
  const match = description.match(
    /scheduled for ([A-Za-z]+ \d{1,2}-\d{1,2}, \d{4})/i,
  );

  if (match?.[1]) {
    return match[1].replace("-", " – ");
  }

  const endDate = event.endDate;

  if (endDate) {
    const parsed = new Date(endDate);

    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(parsed);
    }
  }

  return DEFAULT_GROUP_STAGE_DATE_RANGE;
}
