import { Check, X } from "lucide-react";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

const pickTeamFlagClassName =
  "h-[23px] w-[23px] text-[23px] shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]";

function normalizeLegStatus(
  legStatus?: string
): "RESOLVED_WIN" | "RESOLVED_LOSS" | undefined {
  if (!legStatus) {
    return undefined;
  }

  const normalized = legStatus.trim().toUpperCase();

  if (normalized === "RESOLVED_WIN") {
    return "RESOLVED_WIN";
  }

  if (normalized === "RESOLVED_LOSS" || normalized === "LOSS") {
    return "RESOLVED_LOSS";
  }

  return undefined;
}

export type PositionPickTeamFlagProps = {
  logoUrl?: string;
  code?: string;
  name: string;
  legStatus?: string;
  className?: string;
};

export function PositionPickTeamFlag({
  logoUrl,
  code,
  name,
  legStatus,
  className
}: PositionPickTeamFlagProps) {
  const resolvedStatus = normalizeLegStatus(legStatus);

  if (resolvedStatus === "RESOLVED_WIN") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center bg-[#65AF14] rounded-full w-[20px] h-[20px] text-[20px]",
          className
        )}
        aria-hidden
      >
        <Check className="size-3 text-white" strokeWidth={2.5} />
      </span>
    );
  }

  if (resolvedStatus === "RESOLVED_LOSS") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center bg-[#FF674B] rounded-full w-[20px] h-[20px] text-[20px]",
          className
        )}
        aria-hidden
      >
        <X className="size-3 text-white" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }

  return (
    <TeamFlag
      code={code}
      logoUrl={logoUrl}
      name={name}
      className={cn(pickTeamFlagClassName, className)}
    />
  );
}
