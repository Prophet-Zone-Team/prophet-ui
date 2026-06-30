import type { ProphetGetTeamLineupData } from "@/types/prophet-api";

export interface TeamLineupPlayerView {
  playerId: number;
  name: string;
  number?: number;
  position?: string;
  /** Depth line from API grid (1 = goalkeeper line). */
  gridLine?: number;
  /** Lateral slot from API grid (1 = left). */
  gridPosition?: number;
}

export interface TeamLineupView {
  formation?: string;
  matchTime?: number;
  starters: TeamLineupPlayerView[];
}

const POS_LABELS: Record<string, string> = {
  G: "GK",
  D: "DEF",
  M: "MID",
  F: "FWD"
};

function parseGrid(grid?: string): { line: number; position: number } | undefined {
  if (!grid) {
    return undefined;
  }

  const parts = grid.split(":");
  if (parts.length !== 2) {
    return undefined;
  }

  // API format is "line:position" — depth line then lateral slot.
  const line = Number(parts[0]);
  const position = Number(parts[1]);

  if (!Number.isFinite(line) || !Number.isFinite(position)) {
    return undefined;
  }

  return { line, position };
}

function normalizeTeamName(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function mapLineupEntry(
  entry: ProphetGetTeamLineupData[number]
): TeamLineupView | undefined {
  const starters = (entry.startXIs ?? []).map(({ player }) => {
    const grid = parseGrid(player.grid);

    return {
      playerId: player.id,
      name: player.name,
      number: player.number,
      position: player.pos ? (POS_LABELS[player.pos] ?? player.pos) : undefined,
      gridLine: grid?.line,
      gridPosition: grid?.position
    };
  });

  if (starters.length === 0) {
    return undefined;
  }

  return {
    formation: entry.formation,
    matchTime: entry.match_time,
    starters
  };
}

export function mapProphetTeamLineup(
  data: ProphetGetTeamLineupData | null | undefined
): TeamLineupView | undefined {
  if (!data?.length) {
    return undefined;
  }

  return mapLineupEntry(data[0]);
}

export function findTeamLineupByName(
  data: ProphetGetTeamLineupData | null | undefined,
  teamName: string
): TeamLineupView | undefined {
  const normalized = normalizeTeamName(teamName);
  const entry = data?.find(
    (item) => normalizeTeamName(item.team_name) === normalized
  );

  return entry ? mapLineupEntry(entry) : undefined;
}

const LINEUP_MAX_LINE = 5;

/** Map player id to pitch placement; position is normalized within each line. */
export function buildLineupPlacementMap(
  starters: TeamLineupPlayerView[]
): Map<number, { left: string; top: string }> {
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

  const styles = new Map<number, { left: string; top: string }>();

  for (const player of starters) {
    if (player.gridLine == null || player.gridPosition == null) {
      continue;
    }

    const maxPosition =
      maxPositionByLine.get(player.gridLine) ?? player.gridPosition;
    const left = ((player.gridPosition - 0.5) / maxPosition) * 100;
    const top =
      ((LINEUP_MAX_LINE - player.gridLine + 0.5) / LINEUP_MAX_LINE) * 100;

    styles.set(player.playerId, {
      left: `${left}%`,
      top: `${top}%`
    });
  }

  return styles;
}
