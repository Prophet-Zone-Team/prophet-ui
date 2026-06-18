"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { CollapsedBody } from "@/views/combo/combo-item/collapsed-body";
import { comboItemCardClassName } from "@/views/combo/combo-item/constants";
import { ComboItemHeader } from "@/views/combo/combo-item/combo-item-header";
import { ExpandedBody } from "@/views/combo/combo-item/expanded-body";
import { MatchupTitle } from "@/views/combo/combo-item/matchup-title";
import type { ComboItemProps, ComboOddsOption } from "@/views/combo/combo-item/types";

export function ComboItem({
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
}: ComboItemProps) {
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const [selectedOddsIdState, setSelectedOddsIdState] = useState<
    string | undefined
  >(defaultSelectedOddsId);

  const expanded = expandedProp ?? expandedState;
  const isSelectedOddsControlled = selectedOddsIdProp !== undefined;
  const selectedOddsId = isSelectedOddsControlled
    ? (selectedOddsIdProp ?? undefined)
    : selectedOddsIdState;

  const previewOdds = [
    ...spreadOdds.slice(0, 2),
    ...totalOdds.slice(0, 2)
  ];

  const resolvedTotalCount =
    totalOddsCount ??
    moneylineOdds.length + spreadOdds.length + topScoreOdds.length + totalOdds.length;

  const handleToggleExpanded = () => {
    const next = !expanded;

    if (expandedProp === undefined) {
      setExpandedState(next);
    }

    onExpandedChange?.(next);
  };

  const handleSelectOdds = (option: ComboOddsOption) => {
    if (!isSelectedOddsControlled) {
      setSelectedOddsIdState((current) =>
        current === option.id ? undefined : option.id,
      );
    }

    onSelectOdds?.(option);
  };

  return (
    <article className={cn(comboItemCardClassName, className)}>
      <ComboItemHeader
        kickoffLabel={kickoffLabel}
        isLive={isLive}
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
