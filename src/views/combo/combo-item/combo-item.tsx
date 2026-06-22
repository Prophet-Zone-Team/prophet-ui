"use client";

import { useState } from "react";

import Drawer from "@/components/drawer";
import { cn } from "@/lib/cn";
import { resolveDefaultComboMatchTotalPreviewOdds } from "@/lib/combo/map-market-to-combo-item";
import { CollapsedBody } from "@/views/combo/combo-item/collapsed-body";
import { comboItemCardClassName } from "@/views/combo/combo-item/constants";
import { ComboItemHeader } from "@/views/combo/combo-item/combo-item-header";
import { ExpandedBody } from "@/views/combo/combo-item/expanded-body";
import { MatchupTitle } from "@/views/combo/combo-item/matchup-title";
import { MobileCollapsedBody } from "@/views/combo/combo-item/mobile-collapsed-body";
import { MobileExpandedDrawer } from "@/views/combo/combo-item/mobile-expanded-drawer";
import { isComboOddsOptionSelected } from "@/views/combo/combo-item/selection";
import type { ComboItemProps, ComboOddsOption } from "@/views/combo/combo-item/types";

export function ComboItem({
  kickoffLabel,
  isLive = false,
  homeTeam,
  awayTeam,
  moneylineOdds,
  halftimeOdds = [],
  bttsOdds = [],
  spreadOdds,
  topScoreOdds,
  totalOdds = [],
  totalOddsCount,
  selectedLegsCount: selectedLegsCountProp,
  selectedOddsIds: selectedOddsIdsProp,
  selectedOddsId: selectedOddsIdProp,
  defaultSelectedOddsId,
  expanded: expandedProp,
  defaultExpanded = false,
  onSelectOdds,
  onExpandedChange,
  className
}: ComboItemProps) {
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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
    ...resolveDefaultComboMatchTotalPreviewOdds(totalOdds),
  ];

  const resolvedTotalCount =
    totalOddsCount ??
    moneylineOdds.length +
      halftimeOdds.length +
      spreadOdds.length +
      topScoreOdds.length +
      totalOdds.length;

  const resolvedSelectedLegsCount =
    selectedLegsCountProp ??
    selectedOddsIdsProp?.length ??
    (selectedOddsId ? 1 : 0);

  const isOptionSelected = (optionId: string) =>
    isComboOddsOptionSelected(optionId, selectedOddsIdsProp, selectedOddsId);

  const handleToggleExpanded = () => {
    const next = !expanded;

    if (expandedProp === undefined) {
      setExpandedState(next);
    }

    onExpandedChange?.(next);
  };

  const handleSelectOdds = (option: ComboOddsOption) => {
    if (option.disabled) {
      return;
    }

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
        selectedLegsCount={resolvedSelectedLegsCount}
        onToggleExpanded={handleToggleExpanded}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        centerContent={
          expanded ? (
            <MatchupTitle homeTeam={homeTeam} awayTeam={awayTeam} />
          ) : undefined
        }
      />

      {expanded ? (
        <div className="hidden md:block">
          <ExpandedBody
            moneylineOdds={moneylineOdds}
            halftimeOdds={halftimeOdds}
            bttsOdds={bttsOdds}
            spreadOdds={spreadOdds}
            topScoreOdds={topScoreOdds}
            totalOdds={totalOdds}
            isOptionSelected={isOptionSelected}
            onSelectOdds={handleSelectOdds}
          />
        </div>
      ) : (
        <CollapsedBody
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          moneylineOdds={moneylineOdds}
          previewOdds={previewOdds}
          isOptionSelected={isOptionSelected}
          onSelectOdds={handleSelectOdds}
        />
      )}

      <MobileCollapsedBody
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        moneylineOdds={moneylineOdds}
        previewOdds={previewOdds}
        isOptionSelected={isOptionSelected}
        onSelectOdds={handleSelectOdds}
        totalOddsCount={resolvedTotalCount}
        onOpenAllOdds={() => setMobileDrawerOpen(true)}
      />

      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        hideHeader
        ariaLabel="All odds"
        className="!h-auto max-h-[92dvh] md:hidden"
      >
        <MobileExpandedDrawer
          kickoffLabel={kickoffLabel}
          isLive={isLive}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          moneylineOdds={moneylineOdds}
          halftimeOdds={halftimeOdds}
          bttsOdds={bttsOdds}
          spreadOdds={spreadOdds}
          topScoreOdds={topScoreOdds}
          totalOdds={totalOdds}
          isOptionSelected={isOptionSelected}
          onSelectOdds={handleSelectOdds}
        />
      </Drawer>
    </article>
  );
}
