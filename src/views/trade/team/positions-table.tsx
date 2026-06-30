"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import { debounceEffect } from "@/lib/team/debounced-effect";
import { fetchJson } from "@/lib/team/client-fetch";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type {
  GameMarketSnapshot,
  MarketPositionRecord,
  TeamMarketSnapshot
} from "@/types/market";

export type PositionsTableTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
  active?: boolean;
};

export type PositionsTableGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  active?: boolean;
};

export type PositionsTableProps =
  | PositionsTableTeamProps
  | PositionsTableGameProps;

function resolveConditionIds(props: PositionsTableProps): string[] {
  if (props.variant === "game") {
    return [
      ...new Set(
        props.gameSnapshot.outcomes
          .map((outcome) => outcome.conditionId?.trim())
          .filter((id): id is string => Boolean(id))
      )
    ];
  }

  const conditionId = props.snapshot.market.polymarket?.conditionId?.trim();
  return conditionId ? [conditionId] : [];
}

async function fetchPositionsForMarkets(
  conditionIds: string[]
): Promise<MarketPositionRecord[]> {
  const results = await Promise.all(
    conditionIds.map(async (conditionId) => {
      const payload = await fetchJson<{ positions?: MarketPositionRecord[] }>(
        `/api/market/market-positions?market=${encodeURIComponent(conditionId)}&status=OPEN&sortBy=TOKENS&sortDirection=DESC&limit=50`
      );
      return payload.positions ?? [];
    })
  );

  return results.flat().sort((left, right) => right.size - left.size);
}

export function PositionsTable(props: PositionsTableProps) {
  const t = useTranslations("trade");
  const active = props.active ?? true;
  const [positions, setPositions] = useState<MarketPositionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const teamDisplayName = useLocalizedTeamName(
    props.variant === "game" ? undefined : props.snapshot.team.code,
    props.variant === "game" ? undefined : props.snapshot.team.name
  );
  const gameSides =
    props.variant === "game"
      ? resolveMatchSides(props.gameSnapshot.match, props.teamSnapshots)
      : null;
  const homeDisplayName = useLocalizedTeamName(
    gameSides?.home.code,
    gameSides?.home.name
  );
  const awayDisplayName = useLocalizedTeamName(
    gameSides?.away.code,
    gameSides?.away.name
  );

  const emptyMessage = useMemo(() => {
    if (props.variant === "game" && gameSides) {
      return t("noOpenPositionsForMatch", {
        home: homeDisplayName,
        away: awayDisplayName
      });
    }

    return t("noOpenPositionsForTeam", { teamName: teamDisplayName });
  }, [
    props.variant,
    gameSides,
    t,
    homeDisplayName,
    awayDisplayName,
    teamDisplayName
  ]);

  const conditionIds = useMemo(() => resolveConditionIds(props), [
    props.variant,
    props.variant === "game"
      ? props.gameSnapshot.outcomes.map((outcome) => outcome.conditionId ?? "").join("|")
      : props.snapshot.market.polymarket?.conditionId ?? "",
  ]);
  const conditionIdsKey = conditionIds.join(",");

  useEffect(() => {
    if (!active) {
      return;
    }

    let ignore = false;

    async function load() {
      const silent = hasLoadedOnceRef.current;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      if (conditionIds.length === 0) {
        if (!ignore) {
          setPositions([]);
          setLoading(false);
        }
        return;
      }

      try {
        const nextPositions = await fetchPositionsForMarkets(conditionIds);

        if (!ignore) {
          setPositions(nextPositions);
        }
      } catch (loadError) {
        if (!ignore && !silent) {
          setPositions([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("unableToLoadPositions")
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      }
    }

    const cancelDebounce = debounceEffect(() => {
      if (!ignore) {
        void load();
      }
    });

    return () => {
      ignore = true;
      cancelDebounce();
    };
  }, [active, conditionIdsKey, t]);

  const hasData = positions.length > 0;

  if (conditionIds.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        {t("positionsDataUnavailable")}
      </p>
    );
  }

  if (error && !hasData) {
    return (
      <div className="px-4 py-10 text-center">
        <strong className="block text-sm font-[500] text-prophet-foreground">
          {t("positionsUnavailable")}
        </strong>
        <p className="m-0 mt-2 text-sm text-prophet-muted">{error}</p>
      </div>
    );
  }

  if (loading && !hasData && !error) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        {t("loadingPositions")}
      </p>
    );
  }

  if (!loading && !hasData && !error) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        {emptyMessage}
      </p>
    );
  }

  if (!hasData) {
    return null;
  }

  return (
    <div>
      {positions.map((position) => (
        <div
          key={`${position.asset}:${position.proxyWallet}`}
          className="grid grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2.5 text-sm last:border-b-0"
        >
          <strong className="truncate font-[500]">{position.outcome}</strong>
          <span className="tabular-nums">{position.size.toFixed(2)}</span>
          <span className="tabular-nums">
            {formatTeamDetailMoney(position.currentValue)}
          </span>
          <span
            className={cn(
              "tabular-nums",
              position.cashPnl >= 0 ? "text-prophet-green" : "text-prophet-red"
            )}
          >
            {formatTeamDetailMoney(position.cashPnl)}
          </span>
          <span className="tabular-nums">
            {formatTeamDetailMoney(position.avgPrice)}
          </span>
        </div>
      ))}
    </div>
  );
}
