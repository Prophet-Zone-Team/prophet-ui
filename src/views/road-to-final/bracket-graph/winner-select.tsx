import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";

export function WinnerSelect({
  label,
  matchId,
  onWinnerChange,
  options,
  value
}: {
  label: string;
  matchId: number;
  onWinnerChange: (matchId: number, teamId: string) => void;
  options: WorldCup2026GroupTeam[];
  value: string;
}) {
  const isReady = options.length > 0;

  return (
    <label
      className={cn(
        "mt-[8px] flex flex-col gap-[4px]",
        !isReady && "opacity-60"
      )}
    >
      <span className="text-[10px] font-[300] text-[#909090]">{label}</span>
      <select
        aria-label={`${label} for match ${matchId}`}
        disabled={!isReady}
        value={isReady ? value : ""}
        onChange={(event) => onWinnerChange(matchId, event.target.value)}
        className="h-[28px] rounded-[6px] border border-[#EBEBEB] bg-white px-[8px] text-[12px] text-black"
      >
        <option value="">{isReady ? "Select team" : "Waiting"}</option>
        {options.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}
