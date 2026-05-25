"use client";

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

const ROUND_HEADERS = [
  { key: "r16", label: "Round of 16", width: BRACKET_SLOT_WIDTH + 10 },
  { key: "r16-gap", label: "", width: 25 },
  { key: "qf", label: "Quater Finals", width: BRACKET_SLOT_WIDTH + 10 },
  { key: "qf-gap", label: "", width: 20 },
  { key: "sf", label: "Semi Finals", width: BRACKET_SLOT_WIDTH + 10 },
  { key: "sf-gap", label: "", width: 28 },
  { key: "final", label: "Final", width: finalColumnWidth() }
] as const;

export type RoadToFinalProps = {
  bracket?: RoadToFinalBracket;
  className?: string;
};

export function RoadToFinal({
  bracket = roadToFinalBracket,
  className
}: RoadToFinalProps) {
  const bodyHeight = r16BracketHeight();
  const r16Tops = buildSlotTops("r16");
  const qfTops = buildSlotTops("qf");
  const sfTops = buildSlotTops("sf");

  return (
    <div
      className={cn("relative shrink-0", className)}
      aria-label="Knockout bracket road to final"
    >
      <div className="flex items-start">
        {ROUND_HEADERS.map((round) => (
          <span
            key={round.key}
            className="shrink-0 text-[12px] font-[300] leading-[17px] text-[#909090]"
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
