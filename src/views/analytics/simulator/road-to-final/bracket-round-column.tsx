import { cn } from "@/lib/cn";

import { BracketSlot } from "./bracket-slot";
import { BRACKET_SLOT_WIDTH } from "./bracket-layout";
import type { RoadToFinalSlot } from "./types";

export type BracketRoundColumnProps = {
  slots: RoadToFinalSlot[];
  slotTops: number[];
  bodyHeight: number;
  className?: string;
};

export function BracketRoundColumn({
  slots,
  slotTops,
  bodyHeight,
  className
}: BracketRoundColumnProps) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: BRACKET_SLOT_WIDTH, height: bodyHeight }}
    >
      {slots.map((team, index) => (
        <BracketSlot
          key={index}
          team={team}
          className="absolute left-0"
          style={{ top: slotTops[index] }}
        />
      ))}
    </div>
  );
}
