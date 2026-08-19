"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { CollapsedBody } from "@/views/markets/content/market-item/collapsed-body";
import { marketItemCardClassName } from "@/views/markets/content/market-item/constants";
import { ExpandedBody } from "@/views/markets/content/market-item/expanded-body";
import { MarketItemHeader } from "@/views/markets/content/market-item/market-item-header";
import { MatchupTitle } from "@/views/markets/content/market-item/matchup-title";
import type {
  MarketItemProps,
  MarketOddsOption
} from "@/views/markets/content/market-item/types";

export function MarketItem({
  matchId,
  kickoffLabel,
  isLive = false,
  homeTeam,
  awayTeam,
  moneylineOdds,
  spreadOdds,
  topScoreOdds,
  totalOdds = [],
  totalOddsCount,
  selectedOddsId: selectedOddsIdProp,
  defaultSelectedOddsId,
  expanded: expandedProp,
  defaultExpanded = false,
  onSelectOdds,
  onExpandedChange,
  className
}: MarketItemProps) {
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const [selectedOddsIdState, setSelectedOddsIdState] = useState<
    string | undefined
  >(defaultSelectedOddsId);

  const expanded = expandedProp ?? expandedState;
  const isSelectedOddsControlled = selectedOddsIdProp !== undefined;
  const selectedOddsId = isSelectedOddsControlled
    ? (selectedOddsIdProp ?? undefined)
    : selectedOddsIdState;

  const previewOdds = [...spreadOdds.slice(0, 2), ...totalOdds.slice(0, 2)];

  const resolvedTotalCount =
    totalOddsCount ??
    moneylineOdds.length +
      spreadOdds.length +
      topScoreOdds.length +
      totalOdds.length;

  const handleToggleExpanded = () => {
    const next = !expanded;

    if (expandedProp === undefined) {
      setExpandedState(next);
    }

    onExpandedChange?.(next);
  };

  const handleSelectOdds = (option: MarketOddsOption) => {
    if (!isSelectedOddsControlled) {
      setSelectedOddsIdState((current) =>
        current === option.id ? undefined : option.id
      );
    }

    onSelectOdds?.(option);
  };

  return (
    <article className={cn(marketItemCardClassName, className)}>
      <MarketItemHeader
        matchId={matchId}
        kickoffLabel={kickoffLabel}
        isLive={isLive}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        expanded={expanded}
        totalCount={resolvedTotalCount}
        onToggleExpanded={handleToggleExpanded}
        centerContent={
          expanded ? (
            <MatchupTitle homeTeam={homeTeam} awayTeam={awayTeam} />
          ) : undefined
        }
      />

      {expanded ? (
        <ExpandedBody
          moneylineOdds={moneylineOdds}
          spreadOdds={spreadOdds}
          topScoreOdds={topScoreOdds}
          selectedOddsId={selectedOddsId}
          onSelectOdds={handleSelectOdds}
        />
      ) : (
        <CollapsedBody
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          moneylineOdds={moneylineOdds}
          previewOdds={previewOdds}
          selectedOddsId={selectedOddsId}
          onSelectOdds={handleSelectOdds}
        />
      )}
    </article>
  );
}
