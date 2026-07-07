import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";

import {
  normalizeKnockoutMethod
} from "./method-keys";
import { ROAD_TO_FINAL_BRACKET_VERSION } from "./fixed-group-stage";
import { mergeWithFixedKnockoutWinners } from "./fixed-knockout";
import type { KnockoutWinners } from "../types";

export type RoadToFinalUrlPayload = {
  p?: string;
  t?: string;
  f?: string;
  w?: Record<string, string>;
  m?: string;
  km?: string;
  s?: number;
  bv?: number;
};

export type RoadToFinalSharedState = {
  teamId: string;
  knockoutWinners: KnockoutWinners;
  knockoutMethod: string;
};

export function encodeUrlState(state: RoadToFinalSharedState): string {
  const payload: RoadToFinalUrlPayload = {
    f: state.teamId,
    w: Object.fromEntries(
      Object.entries(state.knockoutWinners).map(([matchId, teamId]) => [
        String(matchId),
        teamId
      ])
    ),
    km: state.knockoutMethod,
    bv: ROAD_TO_FINAL_BRACKET_VERSION
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

  if (payload.f && getWorldCupTeamByIdOrCode(payload.f)) {
    next.teamId = payload.f;
  } else if (!payload.f) {
    next.teamId = fallbackTeamId;
  }

  if (payload.w) {
    if (payload.bv === ROAD_TO_FINAL_BRACKET_VERSION) {
      next.knockoutWinners = mergeWithFixedKnockoutWinners(
        Object.fromEntries(
          Object.entries(payload.w).map(([matchId, teamId]) => [
            Number(matchId),
            teamId,
          ])
        )
      );
    } else {
      next.knockoutWinners = mergeWithFixedKnockoutWinners({});
      next.knockoutMethod = "manualSelection";
    }
  }

  if (payload.km && payload.bv === ROAD_TO_FINAL_BRACKET_VERSION) {
    next.knockoutMethod = normalizeKnockoutMethod(payload.km);
  } else if (payload.m && payload.bv === ROAD_TO_FINAL_BRACKET_VERSION) {
    next.knockoutMethod = normalizeKnockoutMethod(payload.m);
  }

  return next;
}
