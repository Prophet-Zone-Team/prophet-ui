"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import { cn } from "@/lib/cn";

import {
  LEFT_BRACKET_COLUMNS,
  RIGHT_BRACKET_COLUMNS
} from "../lib/bracket-config";
import { buildChampionPathHighlight } from "../lib/champion-path";
import { updateKnockoutWinner } from "../lib/bracket-config";
import type { GroupPlacements, KnockoutWinners } from "../types";
import { BracketConnectors } from "./bracket-connectors";
import { BracketMatchPair } from "./bracket-match-pair";
import { FinalColumn } from "./final-column";
import {
  buildMatchCentersForSide,
  buildMatchTopsForSide,
  buildPairConnectorSpecs,
  columnWidth,
  finalMatchCenter,
  r32BracketHeight
} from "./full-bracket-layout";

function buildRoundConnectorSpecs(
  feederMatchIds: number[],
  targetMatchIds: number[],
  feederCenters: number[],
  targetCenters: number[]
) {
  return buildPairConnectorSpecs(feederCenters, targetCenters).map(
    (spec, pairIndex) => ({
      ...spec,
      sourceMatchIds: [
        feederMatchIds[pairIndex * 2],
        feederMatchIds[pairIndex * 2 + 1]
      ] as [number, number],
      targetMatchId: targetMatchIds[pairIndex]
    })
  );
}

function BracketHalf({
  side,
  columns,
  placements,
  thirdPlaceOption,
  knockoutWinners,
  championTeamId,
  hasChampion,
  disabled,
  onWinnerChange,
  probabilityByTeamId,
  highlightedConnectorKeys,
  highlightedTeamIds,
  bodyHeight
}: {
  side: "left" | "right";
  columns: typeof LEFT_BRACKET_COLUMNS;
  placements: GroupPlacements;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  knockoutWinners: KnockoutWinners;
  championTeamId?: string;
  hasChampion: boolean;
  disabled?: boolean;
  onWinnerChange: (winners: KnockoutWinners) => void;
  probabilityByTeamId?: Map<string, number>;
  highlightedConnectorKeys: Set<string>;
  highlightedTeamIds: Set<string>;
  bodyHeight: number;
}) {
  const t = useTranslations("roadToFinal");
  const roundLabels: Record<string, string> = {
    r32: t("roundOf32"),
    r16: t("roundOf16"),
    qf: t("quarterFinals"),
    sf: t("semiFinals")
  };
  const mirror = side === "right";
  const renderColumns = mirror ? [...columns].reverse() : columns;

  const columnElements: ReactNode[] = [];

  renderColumns.forEach((column, columnIndex) => {
    const matchCount = column.matchIds.length;
    const round = column.key;
    const tops = buildMatchTopsForSide(round, matchCount);
    const centers = buildMatchCentersForSide(round, matchCount);

    if (columnIndex > 0) {
      const prevColumn = renderColumns[columnIndex - 1];
      const prevCenters = buildMatchCentersForSide(
        prevColumn.key,
        prevColumn.matchIds.length
      );
      const connectorKind =
        prevColumn.key === "r32"
          ? "r32-r16"
          : prevColumn.key === "r16"
            ? "r16-qf"
            : prevColumn.key === "qf"
              ? "qf-sf"
              : "sf-final";

      columnElements.push(
        <BracketConnectors
          key={`${side}-connector-${column.key}`}
          kind={connectorKind}
          specs={buildRoundConnectorSpecs(
            prevColumn.matchIds,
            column.matchIds,
            prevCenters,
            centers
          )}
          bodyHeight={bodyHeight}
          highlightedKeys={highlightedConnectorKeys}
          mirror={mirror}
        />
      );
    }

    columnElements.push(
      <div
        key={`${side}-${column.key}`}
        className="relative shrink-0"
        style={{ width: columnWidth(round), height: bodyHeight }}
      >
        <span
          className={cn(
            "absolute -top-[24px] w-full text-[12px] text-white/70",
            side === "left" ? "text-center" : "text-center"
          )}
        >
          {roundLabels[column.key]}
        </span>

        {column.matchIds.map((matchId, index) => (
          <BracketMatchPair
            key={matchId}
            matchId={matchId}
            placements={placements}
            thirdPlaceOption={thirdPlaceOption}
            knockoutWinners={knockoutWinners}
            championTeamId={championTeamId}
            hasChampion={hasChampion}
            disabled={disabled}
            highlightedTeamIds={highlightedTeamIds}
            onWinnerChange={(id, teamId) =>
              onWinnerChange(updateKnockoutWinner(knockoutWinners, id, teamId))
            }
            probabilityByTeamId={probabilityByTeamId}
            variant={round === "r32" ? "r32" : "inner"}
            style={{ top: tops[index], left: 0 }}
          />
        ))}
      </div>
    );
  });

  return (
    <div
      className={cn(
        "flex items-stretch",
        mirror && "flex-row-reverse"
      )}
    >
      {columnElements}
    </div>
  );
}

export function KnockoutBracket({
  placements,
  thirdPlaceOption,
  knockoutWinners,
  championTeamId,
  hasChampion,
  disabled,
  onKnockoutWinnersChange,
  probabilityByTeamId,
  className
}: {
  placements: GroupPlacements;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  knockoutWinners: KnockoutWinners;
  championTeamId?: string;
  hasChampion: boolean;
  disabled?: boolean;
  onKnockoutWinnersChange: (winners: KnockoutWinners) => void;
  probabilityByTeamId?: Map<string, number>;
  className?: string;
}) {
  const t = useTranslations("roadToFinal");
  const bodyHeight = r32BracketHeight();
  const finalCenterY = finalMatchCenter();

  const pathHighlight = useMemo(
    () => buildChampionPathHighlight(knockoutWinners, championTeamId),
    [championTeamId, knockoutWinners]
  );

  const leftSfCenters = buildMatchCentersForSide("sf", 1);
  const rightSfCenters = buildMatchCentersForSide("sf", 1);

  return (
    <div className={cn("min-w-0", className)} aria-label={t("fullKnockoutBracketAria")}>
      <div className="overflow-x-auto overscroll-x-contain pb-[0px] [scrollbar-color:rgba(0,0,0,0.3)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[rgba(0,0,0,0.3)]">
        <div className="mx-auto flex w-fit min-w-[1180px] shrink-0 items-stretch justify-center py-[32px]">
          <BracketHalf
            side="left"
            columns={LEFT_BRACKET_COLUMNS}
            placements={placements}
            thirdPlaceOption={thirdPlaceOption}
            knockoutWinners={knockoutWinners}
            championTeamId={championTeamId}
            hasChampion={hasChampion}
            disabled={disabled}
            onWinnerChange={onKnockoutWinnersChange}
            probabilityByTeamId={probabilityByTeamId}
            highlightedConnectorKeys={pathHighlight.highlightedConnectorKeys}
            highlightedTeamIds={pathHighlight.highlightedTeamIds}
            bodyHeight={bodyHeight}
          />

          <BracketConnectors
            kind="sf-final"
            specs={[
              {
                sourceCenters: [leftSfCenters[0], leftSfCenters[0]] as [
                  number,
                  number
                ],
                targetCenter: finalCenterY,
                pairIndex: 0,
                sourceMatchIds: [101, 101],
                targetMatchId: 104
              }
            ]}
            bodyHeight={bodyHeight}
            highlightedKeys={pathHighlight.highlightedConnectorKeys}
          />

          <FinalColumn
            placements={placements}
            thirdPlaceOption={thirdPlaceOption}
            knockoutWinners={knockoutWinners}
            championTeamId={championTeamId}
            hasChampion={hasChampion}
            disabled={disabled}
            onWinnerChange={(matchId, teamId) =>
              onKnockoutWinnersChange(
                updateKnockoutWinner(knockoutWinners, matchId, teamId)
              )
            }
            probabilityByTeamId={probabilityByTeamId}
            bodyHeight={bodyHeight}
            highlightedTeamIds={pathHighlight.highlightedTeamIds}
          />

          <BracketConnectors
            kind="sf-final"
            specs={[
              {
                sourceCenters: [rightSfCenters[0], rightSfCenters[0]] as [
                  number,
                  number
                ],
                targetCenter: finalCenterY,
                pairIndex: 0,
                sourceMatchIds: [102, 102],
                targetMatchId: 104
              }
            ]}
            bodyHeight={bodyHeight}
            highlightedKeys={pathHighlight.highlightedConnectorKeys}
            mirror
          />

          <BracketHalf
            side="right"
            columns={RIGHT_BRACKET_COLUMNS}
            placements={placements}
            thirdPlaceOption={thirdPlaceOption}
            knockoutWinners={knockoutWinners}
            championTeamId={championTeamId}
            hasChampion={hasChampion}
            disabled={disabled}
            onWinnerChange={onKnockoutWinnersChange}
            probabilityByTeamId={probabilityByTeamId}
            highlightedConnectorKeys={pathHighlight.highlightedConnectorKeys}
            highlightedTeamIds={pathHighlight.highlightedTeamIds}
            bodyHeight={bodyHeight}
          />
        </div>
      </div>
    </div>
  );
}
