import {
  WORLD_CUP_2026_GROUPS,
  WORLD_CUP_2026_GROUP_ORDER,
  getWorldCupTeamByIdOrCode
} from "@/data/world-cup-2026/groups";

import { DEFAULT_THIRD_PLACE_GROUPS } from "./path-config";
import {
  normalizeKnockoutMethod,
  normalizeSortMethod
} from "./method-keys";
import { PLACEMENT_OPTIONS, type GroupPlacements, type KnockoutWinners } from "../types";

const RANK_KEYS = PLACEMENT_OPTIONS.map((option) => option.key);

export type RoadToFinalUrlPayload = {
  p?: string;
  t?: string;
  f?: string;
  w?: Record<string, string>;
  m?: string;
  km?: string;
  s?: number;
};

export type RoadToFinalSharedState = {
  placements: GroupPlacements;
  thirdGroups: string[];
  teamId: string;
  knockoutWinners: KnockoutWinners;
  sortMethod: string;
  knockoutMethod: string;
  step?: 1 | 2 | 3;
};

function sortThirdGroups(groups: string): string[] {
  return [...new Set(groups.split("").map((group) => group.trim().toUpperCase()))]
    .filter((group) => WORLD_CUP_2026_GROUP_ORDER.includes(group as never))
    .sort();
}

export function encodeUrlState(state: RoadToFinalSharedState): string {
  const payload: RoadToFinalUrlPayload = {
    p: WORLD_CUP_2026_GROUP_ORDER.map((group) =>
      RANK_KEYS.map((rank) => state.placements[group][rank]).join(",")
    ).join("|"),
    t: state.thirdGroups.join(""),
    f: state.teamId,
    w: Object.fromEntries(
      Object.entries(state.knockoutWinners).map(([matchId, teamId]) => [
        String(matchId),
        teamId
      ])
    ),
    m: state.sortMethod,
    km: state.knockoutMethod
  };

  const json = JSON.stringify(payload);
  const base64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");

  return base64.replace(/=+$/, "");
}

export function decodeUrlState(raw: string): RoadToFinalUrlPayload | null {
  try {
    const padded = raw + "=".repeat((4 - (raw.length % 4)) % 4);
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(escape(window.atob(padded)))
        : Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json) as RoadToFinalUrlPayload;
  } catch {
    return null;
  }
}

export function hydrateFromUrlPayload(
  payload: RoadToFinalUrlPayload,
  fallbackTeamId: string
): Partial<RoadToFinalSharedState> {
  const next: Partial<RoadToFinalSharedState> = {};

  if (payload.p) {
    const groups = payload.p.split("|");
    const placements = Object.fromEntries(
      WORLD_CUP_2026_GROUP_ORDER.map((group, index) => {
        const ids = (groups[index] ?? "").split(",");
        return [
          group,
          Object.fromEntries(
            RANK_KEYS.map((rank, rankIndex) => [
              rank,
              ids[rankIndex] || WORLD_CUP_2026_GROUPS[group][rankIndex]?.id || ""
            ])
          )
        ];
      })
    ) as GroupPlacements;

    next.placements = placements;
  }

  if (payload.t) {
    next.thirdGroups = sortThirdGroups(payload.t);
  }

  if (payload.f && getWorldCupTeamByIdOrCode(payload.f)) {
    next.teamId = payload.f;
  } else if (!payload.f) {
    next.teamId = fallbackTeamId;
  }

  if (payload.w) {
    next.knockoutWinners = Object.fromEntries(
      Object.entries(payload.w).map(([matchId, teamId]) => [Number(matchId), teamId])
    );
  }

  if (payload.m) {
    next.sortMethod = normalizeSortMethod(payload.m);
  }

  if (payload.km) {
    next.knockoutMethod = normalizeKnockoutMethod(payload.km);
  }

  if (payload.s && payload.s >= 1 && payload.s <= 3) {
    next.step = payload.s as 1 | 2 | 3;
  }

  return next;
}

export function createDefaultSharedState(teamId: string): RoadToFinalSharedState {
  return {
    placements: Object.fromEntries(
      WORLD_CUP_2026_GROUP_ORDER.map((group) => [
        group,
        {
          first: WORLD_CUP_2026_GROUPS[group][0]?.id ?? "",
          second: WORLD_CUP_2026_GROUPS[group][1]?.id ?? "",
          third: WORLD_CUP_2026_GROUPS[group][2]?.id ?? "",
          fourth: WORLD_CUP_2026_GROUPS[group][3]?.id ?? ""
        }
      ])
    ) as GroupPlacements,
    thirdGroups: [...DEFAULT_THIRD_PLACE_GROUPS],
    teamId,
    knockoutWinners: {},
    sortMethod: "defaultOrder",
    knockoutMethod: "manualSelection"
  };
}
