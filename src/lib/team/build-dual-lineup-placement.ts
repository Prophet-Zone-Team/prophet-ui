import type { TeamLineupPlayerView } from "@/lib/team/map-team-lineup";

const LINEUP_MAX_LINE = 5;
const VERTICAL_PADDING_PERCENT = 8;
const VERTICAL_SPAN_PERCENT = 84;
const HOME_LINE_START_PERCENT = 6;
const HOME_LINE_SPAN_PERCENT = 36;
const AWAY_LINE_START_PERCENT = 94;
const AWAY_LINE_SPAN_PERCENT = 36;

function resolveMaxPositionByLine(
  starters: TeamLineupPlayerView[]
): Map<number, number> {
  const maxPositionByLine = new Map<number, number>();

  for (const player of starters) {
    if (player.gridLine == null || player.gridPosition == null) {
      continue;
    }

    const current = maxPositionByLine.get(player.gridLine) ?? 0;
    maxPositionByLine.set(
      player.gridLine,
      Math.max(current, player.gridPosition)
    );
  }

  return maxPositionByLine;
}

/** Map player id to pitch placement for a dual-team horizontal lineup view. */
export function buildDualLineupPlacementMap(
  starters: TeamLineupPlayerView[],
  side: "home" | "away"
): Map<number, { left: string; top: string }> {
  const maxPositionByLine = resolveMaxPositionByLine(starters);
  const styles = new Map<number, { left: string; top: string }>();

  for (const player of starters) {
    if (player.gridLine == null || player.gridPosition == null) {
      continue;
    }

    const maxPosition =
      maxPositionByLine.get(player.gridLine) ?? player.gridPosition;
    const top =
      ((player.gridPosition - 0.5) / maxPosition) * VERTICAL_SPAN_PERCENT +
      VERTICAL_PADDING_PERCENT;
    const lineProgress = (player.gridLine - 0.5) / LINEUP_MAX_LINE;
    const left =
      side === "home"
        ? HOME_LINE_START_PERCENT + lineProgress * HOME_LINE_SPAN_PERCENT
        : AWAY_LINE_START_PERCENT - lineProgress * AWAY_LINE_SPAN_PERCENT;

    styles.set(player.playerId, {
      left: `${left}%`,
      top: `${top}%`
    });
  }

  return styles;
}

export function formatLineupPlayerName(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length <= 1) {
    return name;
  }

  const lastName = parts[parts.length - 1];
  const givenNames = parts.slice(0, -1).join(" ");

  return `${lastName}, ${givenNames}`;
}
