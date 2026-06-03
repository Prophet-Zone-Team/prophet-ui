import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import { STRATEGY_BID_INVALID_SURFACE_CLASS } from "../constants";
import type { StrategyBidSignLegState } from "../types";
import { SignLegStatusIcon } from "./sign-leg-status-icon";

export type SignLegRowProps = {
  entry: StrategyBidSignLegState;
  isLast: boolean;
  onSignAgain: (legId: string) => void;
};

export function SignLegRow({ entry, isLast, onSignAgain }: SignLegRowProps) {
  const showFailedCard =
    entry.status === "sign_failed" || entry.status === "submit_failed";

  if (showFailedCard) {
    return (
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <SignLegStatusIcon status={entry.status} />
          {!isLast ? (
            <span className="mt-1 w-px flex-1 min-h-[24px] bg-[#EBEBEB]" aria-hidden />
          ) : null}
        </div>

        <div
          className={cn(
            STRATEGY_BID_INVALID_SURFACE_CLASS,
            "mb-1 flex min-h-[116px] flex-1 flex-col gap-3 px-3 py-3"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <TeamFlag
                code={entry.leg.team.code}
                name={entry.leg.team.name}
                logoUrl={entry.leg.team.logoUrl}
                fallback={false}
                className="size-[26px] rounded-[4px] object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]"
              />
              <span className="font-[Sora] text-sm font-normal leading-[18px] text-black">
                {entry.leg.teamName}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="font-[Sora] text-sm font-medium leading-[18px] text-black">
                {entry.leg.valuedLabel}
              </span>
              <span className="font-[Sora] text-sm font-normal leading-[18px] text-[#FF674B]">
                Transaction Failed
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSignAgain(entry.leg.id)}
            className="flex h-[50px] w-full items-center justify-center rounded-xl border border-[#EBEBEB] bg-white font-[Sora] text-base font-normal leading-5 text-black transition-opacity hover:opacity-90"
          >
            Sign Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <SignLegStatusIcon status={entry.status} />
        {!isLast ? (
          <span className="mt-1 w-px flex-1 min-h-[24px] bg-[#EBEBEB]" aria-hidden />
        ) : null}
      </div>

      <div className="flex min-h-[26px] flex-1 items-center justify-between gap-3 pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <TeamFlag
            code={entry.leg.team.code}
            name={entry.leg.team.name}
            logoUrl={entry.leg.team.logoUrl}
            fallback={false}
            className="size-[26px] rounded-[4px] object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <span className="font-[Sora] text-sm font-normal leading-[18px] text-black">
            {entry.leg.teamName}
          </span>
          <span className="hidden min-w-0 flex-1 border-t border-[#EBEBEB] sm:block" aria-hidden />
        </div>
        <span className="font-[Sora] text-sm font-medium leading-[18px] text-black">
          {entry.leg.valuedLabel}
        </span>
      </div>
    </div>
  );
}
