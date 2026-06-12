"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { BracketConnectors } from "./bracket-connectors";
import {
  BRACKET_SLOT_WIDTH,
  buildSlotTops,
  finalColumnWidth,
  r16BracketHeight
} from "./bracket-layout";
import { BracketRoundColumn } from "./bracket-round-column";
import { FinalColumn } from "./final-column";
import { roadToFinalBracket } from "./mock-data";
import type { RoadToFinalBracket } from "./types";

export type RoadToFinalProps = {
  bracket?: RoadToFinalBracket;
  className?: string;
};

export function RoadToFinal({
  bracket = roadToFinalBracket,
  className
}: RoadToFinalProps) {
  const t = useTranslations("analytics");
  const roundHeaders = [
    { key: "r16", label: t("roundOf16"), width: BRACKET_SLOT_WIDTH + 10 },
    { key: "r16-gap", label: "", width: 20 },
    { key: "qf", label: t("quarterFinals"), width: BRACKET_SLOT_WIDTH + 10 },
    { key: "qf-gap", label: "", width: 20 },
    { key: "sf", label: t("semiFinals"), width: BRACKET_SLOT_WIDTH + 10 },
    { key: "sf-gap", label: "", width: 28 },
    { key: "final", label: t("final"), width: finalColumnWidth() }
  ] as const;
  const bodyHeight = r16BracketHeight();
  const r16Tops = buildSlotTops("r16");
  const qfTops = buildSlotTops("qf");
  const sfTops = buildSlotTops("sf");

  return (
    <div
      className={cn("relative shrink-0", className)}
      aria-label={t("knockoutBracketAria")}
    >
      <div className="flex items-start">
        {roundHeaders.map((round) => (
          <span
            key={round.key}
            className="shrink-0 text-[12px] font-[400] leading-[17px] text-[#909090] whitespace-nowrap"
            style={{ width: round.width }}
            aria-hidden={round.label ? undefined : true}
          >
            {round.label}
          </span>
        ))}
      </div>

      <div className="h-[252px] overflow-y-auto">
        <div
          className="relative mt-[12px] flex items-stretch overflow-visible"
          style={{ height: bodyHeight }}
        >
          <BracketRoundColumn
            slots={bracket.r16}
            slotTops={r16Tops}
            bodyHeight={bodyHeight}
          />
          <BracketConnectors kind="r16-qf" bodyHeight={bodyHeight} />
          <BracketRoundColumn
            slots={bracket.qf}
            slotTops={qfTops}
            bodyHeight={bodyHeight}
          />
          <BracketConnectors kind="qf-sf" bodyHeight={bodyHeight} />
          <BracketRoundColumn
            slots={bracket.sf}
            slotTops={sfTops}
            bodyHeight={bodyHeight}
          />
          <BracketConnectors kind="sf-final" bodyHeight={bodyHeight} />
          <FinalColumn teams={bracket.final} bodyHeight={bodyHeight} />
        </div>
      </div>
    </div>
  );
}
