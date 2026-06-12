"use client";

import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import type { PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import { updateKnockoutWinner } from "../lib/bracket-config";
import type { BracketSide, GroupPlacements, KnockoutWinners } from "../types";
import { BracketCanvas } from "./bracket-canvas";

export function RoadBracketGraph({
  knockoutWinners,
  onWinnerChange,
  placements,
  result,
  thirdPlaceOption
}: {
  knockoutWinners: KnockoutWinners;
  onWinnerChange: (winners: KnockoutWinners) => void;
  placements: GroupPlacements;
  result: PathResult;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const t = useTranslations("roadToFinal");
  const activeMatchIds = new Set(result.pathMatchIds);
  const selectedTeam = getWorldCupTeamByIdOrCode(result.teamId);
  const selectedTeamName = useLocalizedTeamName(
    selectedTeam?.code ?? result.teamCode ?? "",
    selectedTeam?.name ?? result.teamName
  );
  const [collapsedSides, setCollapsedSides] = useState({
    left: false,
    right: false
  });
  const [expanded, setExpanded] = useState(false);
  const [canPortal, setCanPortal] = useState(false);
  const optionLabel = thirdPlaceOption
    ? t("annexeCOptionLabel", { option: thirdPlaceOption.option })
    : t("chooseEightThirdGroups");

  const toggleSide = (side: Exclude<BracketSide, "center">) => {
    setCollapsedSides((current) => ({ ...current, [side]: !current[side] }));
  };

  const handleWinnerChange = (matchId: number, nextTeamId: string) => {
    onWinnerChange(updateKnockoutWinner(knockoutWinners, matchId, nextTeamId));
  };

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    if (!expanded || typeof document === "undefined") {
      return undefined;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [expanded]);

  const tools = (
    <div
      className="flex flex-wrap items-center gap-[8px]"
      aria-label={t("bracketDisplayControlsAria")}
    >
      <button
        type="button"
        aria-label={
          collapsedSides.left ? t("expandLeftHalf") : t("collapseLeftHalf")
        }
        className={cn(
          "inline-flex items-center gap-[4px] rounded-[6px] border px-[10px] py-[6px] text-[12px]",
          collapsedSides.left
            ? "border-[#EBEBEB] bg-white text-[#909090]"
            : "border-[#18110F] bg-[#18110F] text-white"
        )}
        onClick={() => toggleSide("left")}
      >
        {collapsedSides.left ? (
          <ChevronRight className="h-3 w-3" aria-hidden />
        ) : (
          <ChevronLeft className="h-3 w-3" aria-hidden />
        )}
        {t("leftHalf")}
      </button>
      <button
        type="button"
        aria-label={
          collapsedSides.right ? t("expandRightHalf") : t("collapseRightHalf")
        }
        className={cn(
          "inline-flex items-center gap-[4px] rounded-[6px] border px-[10px] py-[6px] text-[12px]",
          collapsedSides.right
            ? "border-[#EBEBEB] bg-white text-[#909090]"
            : "border-[#18110F] bg-[#18110F] text-white"
        )}
        onClick={() => toggleSide("right")}
      >
        {t("rightHalf")}
        {collapsedSides.right ? (
          <ChevronLeft className="h-3 w-3" aria-hidden />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden />
        )}
      </button>
      <button
        type="button"
        aria-label={t("openFullscreenBracket")}
        className="inline-flex items-center gap-[4px] rounded-[6px] border border-[#EBEBEB] bg-white px-[10px] py-[6px] text-[12px] text-black"
        onClick={() => setExpanded(true)}
      >
        <Maximize2 className="h-3 w-3" aria-hidden />
        {t("fullscreen")}
      </button>
    </div>
  );

  return (
    <div aria-label={t("fullKnockoutBracketAria")}>
      <div className="mb-[12px] flex flex-wrap items-center justify-between gap-[12px]">
        <button
          type="button"
          className="inline-flex items-center gap-[6px] rounded-[6px] border border-[#EBEBEB] bg-white px-[10px] py-[6px] text-[12px] text-black"
          aria-label={t("openFullscreenBracketFor", { optionLabel })}
          onClick={() => setExpanded(true)}
        >
          <Maximize2 className="h-3 w-3" aria-hidden />
          {optionLabel}
        </button>
        <strong className="text-[14px] font-[400] text-black">
          {t("pathHighlighted", { teamName: selectedTeamName })}
        </strong>
        {tools}
      </div>

      <BracketCanvas
        activeMatchIds={activeMatchIds}
        collapsedSides={collapsedSides}
        knockoutWinners={knockoutWinners}
        onToggleSide={toggleSide}
        onWinnerChange={handleWinnerChange}
        placements={placements}
        result={result}
        thirdPlaceOption={thirdPlaceOption}
      />

      {expanded && canPortal
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex flex-col bg-white">
              <div className="flex shrink-0 items-center justify-between border-b border-[#EBEBEB] px-[20px] py-[12px]">
                <div>
                  <span className="text-[12px] font-[300] text-[#909090]">
                    {t("featureLabel")}
                  </span>
                  <strong className="mt-[4px] block text-[16px] font-[400] text-black">
                    {optionLabel}
                  </strong>
                </div>
                <div className="flex items-center gap-[8px]">
                  {tools}
                  <button
                    type="button"
                    aria-label={t("exitFullscreenBracket")}
                    className="inline-flex items-center gap-[4px] rounded-[6px] border border-[#EBEBEB] px-[10px] py-[6px] text-[12px]"
                    onClick={() => setExpanded(false)}
                  >
                    <Minimize2 className="h-3 w-3" aria-hidden />
                    {t("exit")}
                  </button>
                  <button
                    type="button"
                    aria-label={t("closeFullscreenBracket")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#EBEBEB]"
                    onClick={() => setExpanded(false)}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-[16px]">
                <BracketCanvas
                  activeMatchIds={activeMatchIds}
                  collapsedSides={collapsedSides}
                  knockoutWinners={knockoutWinners}
                  onToggleSide={toggleSide}
                  onWinnerChange={handleWinnerChange}
                  placements={placements}
                  result={result}
                  thirdPlaceOption={thirdPlaceOption}
                  variant="fullscreen"
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
