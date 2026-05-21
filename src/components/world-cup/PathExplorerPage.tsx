"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { WORLD_CUP_2026_GROUPS, WORLD_CUP_2026_GROUP_ORDER } from "../../data/world-cup-2026/groups";
import { calculateWorldCupPath } from "../../lib/world-cup-path/calculatePath";
import type { FinishType } from "../../types/market";
import { TeamFlag } from "../teams/TeamFlag";
import { WalletMenuButton } from "../trading/WalletMenuButton";

const FINISH_OPTIONS: Array<{ value: FinishType; label: string }> = [
  { value: "GROUP_WINNER", label: "Group winner" },
  { value: "RUNNER_UP", label: "Runner-up" },
  { value: "BEST_THIRD", label: "Best third" },
];

export function PathExplorerPage({ initialTeamId = "brazil" }: { initialTeamId?: string }) {
  const [teamId, setTeamId] = useState(initialTeamId);
  const [finishType, setFinishType] = useState<FinishType>("GROUP_WINNER");
  const result = useMemo(() => calculateWorldCupPath({ teamId, finishType, mode: "GENERAL" }), [finishType, teamId]);
  const groupTeams = WORLD_CUP_2026_GROUPS[result.group as keyof typeof WORLD_CUP_2026_GROUPS];

  return (
    <main className="prophet-html">
      <div className="page">
        <PathTopbar />
        <section className="panel path-hero">
          <span className="eyebrow">Road to Final</span>
          <h1>Explore the official World Cup knockout path.</h1>
          <p>Choose a team and assumed group finish. The engine expands official Round of 32 slots and FIFA Annexe C third-place allocation options.</p>
          <div className="path-controls">
            <label>
              <span>Team</span>
              <select value={teamId} onChange={(event) => setTeamId(event.target.value)}>
                {WORLD_CUP_2026_GROUP_ORDER.flatMap((group) =>
                  WORLD_CUP_2026_GROUPS[group].map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  )),
                )}
              </select>
            </label>
            <label>
              <span>Finish</span>
              <select value={finishType} onChange={(event) => setFinishType(event.target.value as FinishType)}>
                {FINISH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="path-layout">
          <aside className="panel path-team-card">
            <TeamFlag code={result.teamCode} name={result.teamName} />
            <h2>{result.teamName}</h2>
            <p>{result.seed} / Group {result.group}</p>
            <div className="path-group-list">
              {groupTeams.map((team) => (
                <span key={team.id} className={team.id === result.teamId ? "active" : ""}>{team.name}</span>
              ))}
            </div>
          </aside>

          <section className="path-rounds">
            {result.rounds.map((round) => (
              <article key={round.round} className="panel path-round-card">
                <div className="panel-head">
                  <h2 className="panel-title">{round.round}</h2>
                  <span className="live">{round.matchIds.length > 0 ? `M${round.matchIds.join(" / M")}` : "No path"}</span>
                </div>
                <p>{round.possibleOpponentTeamIds.length} possible opponents under the official bracket.</p>
                <div className="path-opponent-list">
                  {round.possibleOpponentTeams.slice(0, 12).map((team) => (
                    <Link key={team.teamId} href={`/team/${team.teamId}`}>
                      {team.teamName}
                    </Link>
                  ))}
                  {round.possibleOpponentTeams.length > 12 ? <span>+{round.possibleOpponentTeams.length - 12} more</span> : null}
                </div>
              </article>
            ))}
          </section>
        </section>

        <section className="panel path-exclusion">
          <div className="panel-head">
            <h2 className="panel-title">Opponent Exclusion Matrix</h2>
            <span className="view-all">{result.neverMeetTeamIds.length} never on this path</span>
          </div>
          <div className="path-exclusion-grid">
            {result.rounds.map((round) => (
              <div key={round.round}>
                <strong>{round.round}</strong>
                <span>{round.possibleOpponentTeamIds.length} possible</span>
                <small>{round.impossibleOpponentTeamIds.length} impossible at this round</small>
              </div>
            ))}
          </div>
          <p>
            {result.teamName} as {result.seed} follows match path {result.pathMatchIds.map((id) => `M${id}`).join(" -> ")}.
          </p>
        </section>
      </div>
    </main>
  );
}

function PathTopbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/matches">Matches</Link>
        <Link href="/teams">Teams</Link>
        <Link href="/search">Search</Link>
        <Link href="/world-cup/path-explorer" aria-current="page">Path</Link>
      </nav>
      <WalletMenuButton />
    </header>
  );
}
