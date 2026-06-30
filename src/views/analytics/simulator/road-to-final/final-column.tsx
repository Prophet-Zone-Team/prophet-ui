import {
  BRACKET_SLOT_WIDTH,
  BRACKET_TROPHY_GAP,
  BRACKET_TROPHY_IMAGE_HEIGHT,
  BRACKET_TROPHY_IMAGE_WIDTH,
  buildSlotTops,
  finalColumnWidth,
  finalConnectorWidth,
  finalMatchCenter
} from "./bracket-layout";
import { BracketSlot } from "./bracket-slot";
import { FinalTrophyConnector } from "./final-trophy-connector";
import type { RoadToFinalSlot } from "./types";

export type FinalColumnProps = {
  teams: RoadToFinalSlot[];
  bodyHeight: number;
};

export function FinalColumn({ teams, bodyHeight }: FinalColumnProps) {
  const lineY = finalMatchCenter();
  const slotTops = buildSlotTops("final");
  const trophyLeft =
    BRACKET_SLOT_WIDTH + finalConnectorWidth() + BRACKET_TROPHY_GAP;

  return (
    <div
      className="relative shrink-0 overflow-visible"
      style={{ width: finalColumnWidth(), height: bodyHeight }}
    >
      {teams.map((team, index) => (
        <BracketSlot
          key={index}
          team={team}
          className="absolute left-0"
          style={{ top: slotTops[index] }}
        />
      ))}

      <div
        className="absolute overflow-visible"
        style={{
          left: BRACKET_SLOT_WIDTH,
          top: 0,
          width: finalConnectorWidth() + 1,
          height: bodyHeight
        }}
      >
        <FinalTrophyConnector />
      </div>

      <img
        src="/prize.png"
        alt="FIFA World Cup trophy"
        width={BRACKET_TROPHY_IMAGE_WIDTH}
        height={BRACKET_TROPHY_IMAGE_HEIGHT}
        className="absolute object-contain"
        style={{
          left: trophyLeft,
          top: lineY - BRACKET_TROPHY_IMAGE_HEIGHT / 2,
          width: BRACKET_TROPHY_IMAGE_WIDTH,
          height: BRACKET_TROPHY_IMAGE_HEIGHT
        }}
      />
    </div>
  );
}
