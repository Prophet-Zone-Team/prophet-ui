"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { translateTradeMessage } from "@/views/trade/trade-widget/trade-i18n";

import { STRATEGY_BID_INVALID_SURFACE_CLASS } from "../constants";
import type { StrategyBidSignLegState } from "../types";
import { SignLegStatusIcon } from "./sign-leg-status-icon";

export type SignLegRowProps = {
  entry: StrategyBidSignLegState;
  isLast: boolean;
  onSign: (legId: string) => void;
  onSignAgain: (legId: string) => void;
};

export function SignLegRow({ entry, isLast, onSign, onSignAgain }: SignLegRowProps) {
  const t = useTranslations("strategy");
  const tAuth = useTranslations("auth");
  const tTrade = useTranslations("trade");
  const teamDisplayName = useLocalizedTeamName(
    entry.leg.team.code,
    entry.leg.teamName
  );
  const errorLabel = entry.errorMessage
    ? translateTradeMessage(entry.errorMessage, tTrade)
    : t("transactionFailed");
  const showActionCard =
    entry.status === "sign_failed" ||
    entry.status === "submit_failed" ||
    (entry.status === "pending" && Boolean(entry.errorMessage));

  const isRetry =
    entry.status === "sign_failed" ||
    entry.status === "submit_failed" ||
    entry.hasSignedOnce === true;

  if (showActionCard) {
    return (
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <SignLegStatusIcon
            status={entry.status}
            showError={entry.status === "pending" && Boolean(entry.errorMessage)}
          />
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
                {teamDisplayName}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="font-[Sora] text-sm font-medium leading-[18px] text-black">
                {entry.leg.valuedLabel}
              </span>
              <span className="font-[Sora] text-sm font-normal leading-[18px] text-[#FF674B]">
                {errorLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              isRetry ? onSignAgain(entry.leg.id) : onSign(entry.leg.id)
            }
            className="flex h-[50px] w-full items-center justify-center rounded-xl border border-[#EBEBEB] bg-white font-[Sora] text-base font-normal leading-5 text-black transition-opacity hover:opacity-90"
          >
            {isRetry ? t("signAgain") : tAuth("sign")}
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
            {teamDisplayName}
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
