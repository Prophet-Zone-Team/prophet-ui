"use client";

import { useMemo } from "react";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import { useTradeMatchOutcomeSide } from "@/store/trade-ticket-store";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";

import { ZettaWalletPanel } from "./zetta-wallet-panel";
import { useZettaSmartWallets } from "./use-zetta-smart-wallets";

type ZettaWalletInsightBaseProps = {
  className?: string;
};

export type ZettaWalletInsightGameProps = ZettaWalletInsightBaseProps & {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type ZettaWalletInsightTeamProps = ZettaWalletInsightBaseProps & {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
};

export type ZettaWalletInsightProps =
  | ZettaWalletInsightGameProps
  | ZettaWalletInsightTeamProps;

function resolveTeamEventSlug(snapshot: TeamMarketSnapshot): string {
  return (
    snapshot.market.polymarket?.slug?.trim() ??
    snapshot.market.slug?.trim() ??
    ""
  );
}

export function ZettaWalletInsight(props: ZettaWalletInsightProps) {
  if (props.variant === "game") {
    return <ZettaWalletInsightGame {...props} />;
  }

  return <ZettaWalletInsightTeam {...props} />;
}

function ZettaWalletInsightGame({
  gameSnapshot,
  teamSnapshots,
  className
}: ZettaWalletInsightGameProps) {
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const eventSlug = gameSnapshot.match.polymarket?.slug?.trim() ?? "";
  const sides = useMemo(
    () => resolveMatchSides(gameSnapshot.match, teamSnapshots),
    [gameSnapshot.match, teamSnapshots]
  );
  const homeTeamName = useLocalizedTeamName(sides.home.code, sides.home.name);
  const awayTeamName = useLocalizedTeamName(sides.away.code, sides.away.name);

  const { counts, isLoading } = useZettaSmartWallets({
    variant: "game",
    eventSlug,
    outcomeSide: matchOutcomeSide,
    homeTeamName,
    awayTeamName
  });

  if (!eventSlug) {
    return null;
  }

  return (
    <ZettaWalletPanel
      counts={counts}
      isLoading={isLoading}
      className={className}
    />
  );
}

function ZettaWalletInsightTeam({
  snapshot,
  className
}: ZettaWalletInsightTeamProps) {
  const eventSlug = resolveTeamEventSlug(snapshot);
  const teamName = useLocalizedTeamName(snapshot.team.code, snapshot.team.name);

  const { counts, isLoading } = useZettaSmartWallets({
    variant: "team",
    eventSlug,
    teamName
  });

  if (!eventSlug) {
    return null;
  }

  return (
    <ZettaWalletPanel
      counts={counts}
      isLoading={isLoading}
      className={className}
    />
  );
}

export { ZettaWalletPanel } from "./zetta-wallet-panel";
export type { ZettaOutcomeWalletCounts, ZettaSmartWalletsResponse } from "./types";
