import type { ProphetGetTeamLineupData } from "@/types/prophet-api";

export interface TeamLineupPlayerView {
  id: number;
  name: string;
  number: number;
  position: string;
  grid: string;
}

export interface TeamLineupView {
  formation?: string;
  players: TeamLineupPlayerView[];
}

export function mapTeamLineupResponse(
  data: ProphetGetTeamLineupData | undefined
): TeamLineupView {
  const lineup = data?.[0];

  if (!lineup) {
    return { players: [] };
  }

  return {
    formation: lineup.formation || undefined,
    players: (lineup.startXIs ?? []).map(({ player }) => ({
      id: player.id,
      name: player.name,
      number: player.number,
      position: player.pos,
      grid: player.grid
    }))
  };
}
