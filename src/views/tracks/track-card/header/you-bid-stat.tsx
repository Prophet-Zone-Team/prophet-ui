import { cn } from "@/lib/cn";

import { trackCardValueClassName } from "../styles";
import { StatColumn } from "./stat-column";

export type YouBidStatProps = {
  amountLabel: string;
  outcomeSide?: "yes" | "no";
  className?: string;
};

export function YouBidStat({ amountLabel, outcomeSide, className }: YouBidStatProps) {
  return (
    <StatColumn label="You Bid" className={className}>
      <span className={trackCardValueClassName}>{amountLabel}</span>
      {outcomeSide ? (
        <span
          className={cn(
            "text-[12px] font-[500] leading-[15px]",
            outcomeSide === "yes" ? "text-[#65AF14]" : "text-[#FF674B]"
          )}
        >
          {outcomeSide === "yes" ? "Yes" : "No"}
        </span>
      ) : null}
    </StatColumn>
  );
}
