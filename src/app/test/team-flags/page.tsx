import { TeamFlag } from "@/components/teams/team-flag";
import teams from "@/data/teams";

export default function TeamFlagsTestPage() {
  const entries = Object.entries(teams).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-black">Team Flags Preview</h1>
      <p className="mt-2 text-sm text-prophet-muted">
        {entries.length} teams from <code>src/data/teams/index.ts</code>
      </p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {entries.map(([key, team]) => (
          <li
            key={key}
            className="flex items-center gap-3 rounded-lg border border-prophet-line/80 bg-white px-3 py-2.5"
          >
            <TeamFlag name={key} logoUrl={team.logo} className="h-8 w-8 text-[28px]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-black">{team.name}</p>
              <p className="truncate text-xs text-prophet-muted">
                {team.logo} · {team.abbreviation}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
