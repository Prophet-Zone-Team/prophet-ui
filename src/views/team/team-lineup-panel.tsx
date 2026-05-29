import type {
  ApiFootballDataIssue,
  ApiFootballInjuryContext,
  ApiFootballSquadPlayer
} from "@/types/market";
import {
  getInitials,
  getLineupPlayers,
  shortenName
} from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";


export interface TeamLineupPanelProps {
  squad: ApiFootballSquadPlayer[];
  injuries: ApiFootballInjuryContext[];
  dataIssues: ApiFootballDataIssue[];
}

function PlayerAvatar({ player }: { player: ApiFootballSquadPlayer }) {
  if (player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={player.name}
        className="mx-auto size-8 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-white/90 text-[9px] font-[556] text-[#125afc]">
      {getInitials(player.name)}
    </span>
  );
}

function MiniPlayerRow({ player }: { player: ApiFootballSquadPlayer }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-prophet-line px-2 py-1.5 text-xs">
      <span className="w-5 text-prophet-muted">{player.number ?? "-"}</span>
      <strong className="min-w-0 flex-1 truncate font-[556] text-black">
        {player.name}
      </strong>
      <small className="text-prophet-muted">{player.position ?? "Player"}</small>
    </div>
  );
}

export function TeamLineupPanel({
  squad,
  injuries,
  dataIssues
}: TeamLineupPanelProps) {
  const starters = getLineupPlayers(squad);
  const bench = squad
    .filter(
      (player) =>
        !starters.some((starter) => starter.playerId === player.playerId)
    )
    .slice(0, 7);
  const hasSquad = squad.length > 0;

  return (
    <section className={teamPanelClass} aria-label="Expected starting XI">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Expected Starting XI</h2>
      </div>
      <div className="p-4">
        {hasSquad ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(200px,0.8fr)]">
            <div className="relative min-h-[280px] rounded-xl border border-[#65af14]/40 bg-gradient-to-b from-[#e8f5e0] to-[#d4edc4] p-3">
              <div className="grid h-full grid-cols-3 grid-rows-5 gap-1">
                {Array.from({ length: 11 }, (_, index) => {
                  const player = starters[index];

                  if (!player) {
                    return <div key={`empty-${index}`} />;
                  }

                  return (
                    <div
                      key={player.playerId}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      <PlayerAvatar player={player} />
                      <strong className="mt-1 max-w-[72px] truncate text-[10px] font-[556] text-black">
                        {shortenName(player.name)}
                      </strong>
                      <span className="text-[9px] text-prophet-muted">
                        {player.position ?? "Player"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3">
              <div>
                <h3 className="m-0 mb-2 text-sm font-[556] text-black">Bench</h3>
                {bench.length > 0 ? (
                  <div className="grid gap-1.5">
                    {bench.map((player) => (
                      <MiniPlayerRow key={player.playerId} player={player} />
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-xs text-prophet-muted">
                    No bench players stored yet.
                  </p>
                )}
              </div>
              <div>
                <h3 className="m-0 mb-2 text-sm font-[556] text-black">
                  Doubtful / Out
                </h3>
                {injuries.length > 0 ? (
                  <div className="grid gap-1.5">
                    {injuries.slice(0, 4).map((injury) => (
                      <div
                        key={`${injury.playerName}-${injury.reason ?? "injury"}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-prophet-red/30 bg-[#fff4f6] px-2 py-1.5 text-xs"
                      >
                        <span>{injury.playerName}</span>
                        <strong className="font-[556] text-prophet-red">
                          {injury.reason ?? "Injury"}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-xs text-prophet-muted">
                    No injury signal stored.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <TeamEmptyState
            title="Starting XI pending"
            body="Expected starting lineup data is not available for this team yet."
          />
        )}
      </div>
    </section>
  );
}
