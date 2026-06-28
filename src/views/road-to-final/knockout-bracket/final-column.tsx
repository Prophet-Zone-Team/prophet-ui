"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import { cn } from "@/lib/cn";

import { MATCH_LOOKUP } from "../lib/bracket-config";
import { resolveBracketSeed } from "../lib/bracket-resolver";
import type { GroupPlacements, KnockoutWinners } from "../types";
import { BracketMatchPair } from "./bracket-match-pair";
import {
  BRACKET_TROPHY_GAP,
  BRACKET_TROPHY_IMAGE_HEIGHT,
  BRACKET_TROPHY_IMAGE_WIDTH,
  finalColumnWidth,
  finalMatchTop,
  FINAL_MATCH_CARD_WIDTH
} from "./full-bracket-layout";

const FINAL_MATCH_ID = 104;

export function FinalColumn({
  placements,
  thirdPlaceOption,
  knockoutWinners,
  championTeamId,
  hasChampion,
  disabled,
  onWinnerChange,
  probabilityByTeamId,
  bodyHeight,
  highlightedTeamIds,
  validationErrorMatchIds
}: {
  placements: GroupPlacements;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  knockoutWinners: KnockoutWinners;
  championTeamId?: string;
  hasChampion: boolean;
  disabled?: boolean;
  onWinnerChange: (matchId: number, teamId: string) => void;
  probabilityByTeamId?: Map<string, number>;
  bodyHeight: number;
  highlightedTeamIds: Set<string>;
  validationErrorMatchIds?: ReadonlySet<number>;
}) {
  const t = useTranslations("roadToFinal");
  const finalTop = finalMatchTop();

  const trophyPosition = useMemo(() => {
    const leftHalfCenterX = FINAL_MATCH_CARD_WIDTH * 0.25;
    const rightHalfCenterX = FINAL_MATCH_CARD_WIDTH * 0.75;

    if (!hasChampion || !championTeamId) {
      return {
        left: FINAL_MATCH_CARD_WIDTH / 2 - BRACKET_TROPHY_IMAGE_WIDTH / 2,
        top: finalTop - BRACKET_TROPHY_GAP - BRACKET_TROPHY_IMAGE_HEIGHT
      };
    }

    const match = MATCH_LOOKUP.get(FINAL_MATCH_ID);

    if (!match) {
      return {
        left: FINAL_MATCH_CARD_WIDTH / 2 - BRACKET_TROPHY_IMAGE_WIDTH / 2,
        top: finalTop - BRACKET_TROPHY_GAP - BRACKET_TROPHY_IMAGE_HEIGHT
      };
    }

    const leftResolved = resolveBracketSeed(
      match.left,
      match,
      placements,
      thirdPlaceOption,
      knockoutWinners
    ).team;
    const championIsLeft = leftResolved?.id === championTeamId;
    const championCenterX = championIsLeft ? leftHalfCenterX : rightHalfCenterX;

    return {
      left: championCenterX - BRACKET_TROPHY_IMAGE_WIDTH / 2,
      top: finalTop - BRACKET_TROPHY_GAP - BRACKET_TROPHY_IMAGE_HEIGHT
    };
  }, [
    championTeamId,
    finalTop,
    hasChampion,
    knockoutWinners,
    placements,
    thirdPlaceOption
  ]);

  return (
    <div
      className="relative shrink-0 overflow-visible"
      style={{ width: finalColumnWidth(), height: bodyHeight }}
    >
      <span className="absolute -top-[24px] left-0 w-full text-center text-[12px] text-white/70">
        {t("final")}
      </span>

      <BracketMatchPair
        matchId={FINAL_MATCH_ID}
        placements={placements}
        thirdPlaceOption={thirdPlaceOption}
        knockoutWinners={knockoutWinners}
        championTeamId={championTeamId}
        hasChampion={hasChampion}
        disabled={disabled}
        onWinnerChange={onWinnerChange}
        probabilityByTeamId={probabilityByTeamId}
        highlightedTeamIds={highlightedTeamIds}
        showValidationHint={validationErrorMatchIds?.has(FINAL_MATCH_ID) ?? false}
        variant="final"
        style={{ top: finalTop, left: 0 }}
      />

      <img
        src="/analytics/campaign.png"
        alt=""
        width={BRACKET_TROPHY_IMAGE_WIDTH}
        height={BRACKET_TROPHY_IMAGE_HEIGHT}
        className={cn(
          "pointer-events-none absolute object-contain transition-opacity",
          hasChampion ? "opacity-100" : "opacity-40"
        )}
        style={{
          left: trophyPosition.left,
          top: trophyPosition.top,
          width: BRACKET_TROPHY_IMAGE_WIDTH,
          height: BRACKET_TROPHY_IMAGE_HEIGHT
        }}
      />
    </div>
  );
}
