"use client";

import { useMemo } from "react";

import {
  TradeSimpleHeader,
  type TradeSimpleHeaderGameProps,
  type TradeSimpleHeaderProps,
  type TradeSimpleHeaderTeamProps
} from "@/views/trade/simple/header";
import { TradeSimpleHeaderToolbar } from "@/views/trade/simple/header-toolbar";
import { GameProbabilitySection } from "@/views/trade/game-probability";
import { RelatedGames } from "@/views/trade/related-games";
import { TradeSimpleMarketSection } from "@/views/trade/simple/market-section";
import { simpleContentClass } from "@/views/trade/simple/ui";
import { ProbabilitySection } from "@/views/trade/team-probability";
import { TradeWidget } from "@/views/trade/trade-widget";
import type {
  GameMarketSnapshot,
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";

export type TradeSimpleViewGameProps = TradeSimpleHeaderGameProps & {
  gameSnapshot: GameMarketSnapshot;
  relatedMatches: WorldCupMatch[];
};

export type TradeSimpleViewTeamProps = TradeSimpleHeaderTeamProps & {
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  probabilityHistory: ProbabilityHistoryPoint[];
};

export type TradeSimpleViewProps =
  | TradeSimpleViewGameProps
  | TradeSimpleViewTeamProps;

function isGameProps(
  props: TradeSimpleViewProps
): props is TradeSimpleViewGameProps {
  return props.variant === "game";
}

export default function TradeSimpleView(props: TradeSimpleViewProps) {
  const sidebar = useMemo(() => {
    if (isGameProps(props)) {
      const focalTeamId =
        props.match.homeTeamId ??
        props.gameSnapshot.homeTeamId ??
        props.snapshots[0]?.team.id;

      if (!focalTeamId) {
        return {
          relatedGames: {
            teamId: props.snapshots[0]?.team.id ?? "",
            matches: props.relatedMatches,
            snapshots: props.snapshots
          }
        };
      }

      return {
        relatedGames: {
          teamId: focalTeamId,
          matches: props.relatedMatches,
          snapshots: props.snapshots
        }
      };
    }

    const allSnapshots = (() => {
      const byId = new Map(props.snapshots.map((item) => [item.team.id, item]));
      byId.set(props.snapshot.team.id, props.snapshot);
      return [...byId.values()];
    })();

    return {
      snapshot: props.snapshot,
      relatedGames: {
        teamId: props.snapshot.team.id,
        matches: props.matches,
        snapshots: allSnapshots
      }
    };
  }, [props]);

  return (
    <div className="relative left-1/2 pt-6 min-h-[calc(100vh-2.75rem)] w-screen max-w-[100vw] -translate-x-1/2 bg-white">
      <div className="bg-black h-[258px] w-full absolute top-0 left-0" />
      <TradeSimpleHeaderToolbar />
      <div className={`${simpleContentClass} pb-10 relative z-10`}>
        <div className="shrink-0 w-[1000px] pt-2">
          <div className="relative">
            <TradeSimpleHeader {...(props as TradeSimpleHeaderProps)} />
          </div>
          {isGameProps(props) ? (
            <>
              <TradeSimpleMarketSection
                variant="game"
                gameSnapshot={props.gameSnapshot}
                teamSnapshots={props.snapshots}
              />
              <GameProbabilitySection
                match={props.match}
                snapshots={props.snapshots}
              />
            </>
          ) : (
            <>
              <TradeSimpleMarketSection
                variant="team"
                snapshot={props.snapshot}
              />
              <ProbabilitySection
                snapshot={props.snapshot}
                probabilityHistory={props.probabilityHistory}
                matches={props.matches}
                snapshots={sidebar.relatedGames.snapshots}
                showOrderbook={false}
              />
            </>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-4 w-[345px]">
          {isGameProps(props) ? (
            <TradeWidget
              variant="game"
              gameSnapshot={props.gameSnapshot}
              teamSnapshots={props.snapshots}
            />
          ) : sidebar.snapshot ? (
            <TradeWidget snapshot={sidebar.snapshot} />
          ) : null}
          {sidebar.relatedGames.teamId ? (
            <RelatedGames {...sidebar.relatedGames} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
