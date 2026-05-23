"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { WORLD_CUP_2026_GROUPS, WORLD_CUP_2026_GROUP_ORDER, getWorldCupGroupForTeam } from "../../data/world-cup-2026/groups";
import { teamTradeHref } from "../../lib/routes/trade";
import { calculateWorldCupPath } from "../../lib/world-cup-path/calculate-path";
import type { FinishType, PathMode, PathResult } from "../../types/market";
import { TeamFlag } from "../teams/team-flag";
const FINISH_OPTIONS: Array<{ value: FinishType; label: string }> = [
  { value: "GROUP_WINNER", label: "Group winner" },
  { value: "RUNNER_UP", label: "Runner-up" },
  { value: "BEST_THIRD", label: "Best third" },
];

const DEFAULT_THIRD_GROUPS = ["E", "F", "G", "H", "I", "J", "K", "L"];

export function PathExplorerPage({ initialTeamId = "brazil" }: { initialTeamId?: string }) {
  const [teamId, setTeamId] = useState(initialTeamId);
  const [finishType, setFinishType] = useState<FinishType>("GROUP_WINNER");
  const [mode, setMode] = useState<PathMode>("GENERAL");
  const [thirdGroups, setThirdGroups] = useState<string[]>(DEFAULT_THIRD_GROUPS);
  const calculation = useMemo(
    () => safeCalculatePath({
      teamId,
      finishType,
      mode,
      thirdGroups,
    }),
    [finishType, mode, teamId, thirdGroups],
  );
  const result = calculation.result;
  const activeGroup = result?.group ?? getWorldCupGroupForTeam(teamId) ?? "A";
  const groupTeams = WORLD_CUP_2026_GROUPS[activeGroup as keyof typeof WORLD_CUP_2026_GROUPS];

  return (
    <>
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
            <label>
              <span>Mode</span>
              <select value={mode} onChange={(event) => setMode(event.target.value as PathMode)}>
                <option value="GENERAL">General matrix</option>
                <option value="SCENARIO">Third-place scenario</option>
              </select>
            </label>
          </div>
          {mode === "SCENARIO" ? (
            <div className="path-scenario-controls">
              <div>
                <strong>Advancing third-place groups</strong>
                <span>{thirdGroups.length}/8 selected</span>
              </div>
              <div className="third-place-grid" aria-label="Select advancing third-place groups">
                {WORLD_CUP_2026_GROUP_ORDER.map((group) => (
                  <button
                    key={group}
                    type="button"
                    className={thirdGroups.includes(group) ? "active" : ""}
                    onClick={() => setThirdGroups(toggleThirdGroup(thirdGroups, group))}
                  >
                    {group}
                  </button>
                ))}
              </div>
              <p>
                Scenario mode resolves the Annexe C allocation only when exactly eight third-placed groups advance.
              </p>
            </div>
          ) : null}
        </section>

        {calculation.error ? (
          <section className="panel path-error-panel">
            <span className="eyebrow">Scenario needs attention</span>
            <h2>{calculation.error}</h2>
            <p>Select exactly eight third-place groups, or switch back to General matrix mode.</p>
          </section>
        ) : null}

        {result ? <ScenarioResolutionCard result={result} /> : null}

        {result ? <section className="path-layout">
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
                    <Link key={team.teamId} href={teamTradeHref(team.teamId)}>
                      {team.teamName}
                    </Link>
                  ))}
                  {round.possibleOpponentTeams.length > 12 ? <span>+{round.possibleOpponentTeams.length - 12} more</span> : null}
                </div>
              </article>
            ))}
          </section>
        </section> : null}

        {result ? <section className="panel path-exclusion">
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
      </section> : null}
    </>
  );
}

function ScenarioResolutionCard({ result }: { result: PathResult }) {
  const scenario = result.scenario;

  if (!scenario) {
    return null;
  }

  const winnerSeeds = Object.keys(scenario.assignments).filter((seed) => scenario.assignments[seed]?.length);

  return (
    <section className="panel path-scenario-card">
      <div className="panel-head">
        <h2 className="panel-title">{scenario.status === "resolved" ? "Resolved Third-Place Allocation" : "General Third-Place Matrix"}</h2>
        <span className="live">
          {scenario.status === "resolved"
            ? `Option ${scenario.allocationOptionIds.join(" / ")}`
            : `${scenario.allocationOptionIds.length} options`}
        </span>
      </div>
      {scenario.status === "resolved" ? (
        <p>Qualified third-place groups: {scenario.qualifiedThirdGroups.join(", ")}.</p>
      ) : (
        <p>General mode considers every valid Annexe C third-place allocation.</p>
      )}
      <div className="path-assignment-grid">
        {winnerSeeds.map((seed) => (
          <div key={seed}>
            <span>{seed}</span>
            <strong>{scenario.assignments[seed]?.join(" / ")}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function safeCalculatePath({
  teamId,
  finishType,
  mode,
  thirdGroups,
}: {
  teamId: string;
  finishType: FinishType;
  mode: PathMode;
  thirdGroups: string[];
}): { result?: PathResult; error?: string } {
  try {
    return {
      result: calculateWorldCupPath({
        teamId,
        finishType,
        mode,
        scenario: mode === "SCENARIO" ? { qualifiedThirdGroups: thirdGroups } : undefined,
      }),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to calculate this path." };
  }
}

function toggleThirdGroup(selectedGroups: string[], group: string): string[] {
  if (selectedGroups.includes(group)) {
    return selectedGroups.filter((item) => item !== group);
  }

  if (selectedGroups.length >= 8) {
    return [...selectedGroups.slice(1), group].sort();
  }

  return [...selectedGroups, group].sort();
}
