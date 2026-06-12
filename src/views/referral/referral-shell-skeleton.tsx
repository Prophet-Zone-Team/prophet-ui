"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import {
  referralActivityPanelClass,
  referralKickbackCardClass,
  referralRewardsCardClass,
  referralShellClass,
  referralSummaryBarClass,
  referralTopGridClass,
} from "./referral-ui";

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#ebebeb]/80",
        className ?? "h-4 w-full"
      )}
      aria-hidden
    />
  );
}

export function ReferralShellSkeleton() {
  const t = useTranslations("referral");

  return (
    <section
      className={referralShellClass}
      aria-label={t("referralProgram")}
      aria-busy="true"
    >
      <div className={referralTopGridClass}>
        <div className={referralRewardsCardClass} aria-hidden>
          <div className="flex h-full flex-col justify-between p-6 md:p-8">
            <LoadingBlock className="h-4 w-40 bg-white/20" />
            <LoadingBlock className="h-[72px] w-48 bg-white/20" />
            <LoadingBlock className="h-4 w-56 bg-white/20" />
          </div>
        </div>

        <div className={referralKickbackCardClass} aria-hidden>
          <div className="flex flex-1 flex-col px-6 pt-6">
            <LoadingBlock className="h-4 w-28" />
            <LoadingBlock className="mt-3 h-12 w-full" />
          </div>
          <div className="mt-auto min-h-[131px] px-6 pb-6 pt-4">
            <LoadingBlock className="h-10 w-full" />
            <LoadingBlock className="mt-4 h-[50px] w-full" />
          </div>
        </div>
      </div>

      <div className={referralActivityPanelClass} aria-hidden>
        <div className={referralSummaryBarClass}>
          <LoadingBlock className="h-10 w-20" />
          <LoadingBlock className="h-10 w-24" />
          <LoadingBlock className="h-10 w-24" />
          <LoadingBlock className="h-10 w-24" />
          <LoadingBlock className="h-[50px] w-[152px] max-md:w-full" />
        </div>
        <div className="mt-4 px-[30px] py-16">
          <LoadingBlock className="mx-auto h-4 w-40" />
        </div>
      </div>
    </section>
  );
}
