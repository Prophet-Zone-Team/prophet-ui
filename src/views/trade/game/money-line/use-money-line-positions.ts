"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuthOptional } from "@/context/auth";
import { fetchJson } from "@/lib/team/client-fetch";
import type { UserPositionRecord } from "@/types/market";

import { collectMoneyLineConditionIds } from "./resolve-card-positions";
import type { MoneyLineCardDefinition } from "./types";

export function useMoneyLinePositions(cards: MoneyLineCardDefinition[]) {
  const auth = useAuthOptional();
  const session = auth?.session;
  const conditionIds = collectMoneyLineConditionIds(cards);
  const conditionIdsKey = conditionIds.join(",");
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  const reload = useCallback(async () => {
    if (!session || conditionIds.length === 0) {
      setPositions([]);
      setStatus("ready");
      return;
    }

    setStatus("loading");

    try {
      const payload = await fetchJson<{
        positions?: UserPositionRecord[];
        error?: string;
      }>(
        `/api/trading/positions?market=${encodeURIComponent(conditionIds.join(","))}&limit=500`,
      );

      if (payload.error) {
        throw new Error(payload.error);
      }

      setPositions(
        (payload.positions ?? []).filter((position) => position.size > 0),
      );
      setStatus("ready");
    } catch {
      setPositions([]);
      setStatus("error");
    }
  }, [conditionIdsKey, session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    positions,
    status,
    reload,
    hasSession: Boolean(session),
  };
}
