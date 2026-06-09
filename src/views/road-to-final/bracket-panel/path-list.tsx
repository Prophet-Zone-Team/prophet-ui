import type { PathResult } from "@/types/market";

import { ROUND_LABELS } from "../lib/format";

export function PathList({ result }: { result: PathResult }) {
  return (
    <div className="flex flex-col gap-[10px]">
      {result.rounds.map((round) => (
        <article
          key={round.round}
          className="rounded-[8px] border border-[#EBEBEB] bg-white p-[12px]"
        >
          <div className="flex items-center justify-between gap-[8px]">
            <strong className="text-[14px] font-[400] text-black">
              {ROUND_LABELS[round.round]}
            </strong>
            <span className="text-[12px] font-[300] text-[#909090]">
              {round.matchIds.length
                ? `M${round.matchIds.join(" / M")}`
                : "No match"}
            </span>
          </div>
          <p className="m-0 mt-[8px] text-[13px] font-[300] text-[#909090]">
            {round.possibleOpponentTeams
              .slice(0, 8)
              .map((team) => team.teamName)
              .join(", ") || "Pending"}
          </p>
        </article>
      ))}
    </div>
  );
}
