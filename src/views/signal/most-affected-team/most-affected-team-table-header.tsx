import { cn } from "@/lib/cn";

export const mostAffectedTeamTableGridClass =
  "hidden md:grid w-full grid-cols-[10%_30%_22%_34%] items-center gap-x-2";

export function MostAffectedTeamTableHeader() {
  return (
    <div
      role="row"
      className={cn(
        mostAffectedTeamTableGridClass,
        "text-[16px] font-[400] leading-[19px] text-[#909090]"
      )}
    >
      <span role="columnheader">Rank</span>
      <span role="columnheader">Team</span>
      <span role="columnheader">Net Impact</span>
      <span role="columnheader" className="text-right">
        High-Impact Events
      </span>
    </div>
  );
}
