"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { GridTable } from "@/components/grid-table";
import type { GridTableColumn } from "@/components/grid-table";
import { Pagination } from "@/components/pagination/pagination";
import { Popover } from "@/components/popover";
import { useReferralClaim } from "@/hooks/referral/use-referral-claim";
import { useReferralInvites } from "@/hooks/referral/use-referral-invites";
import {
  REFERRAL_ACTIVITY_PAGE_SIZE,
  REFERRAL_CLAIM_MIN_AMOUNT,
} from "@/lib/referral/config";
import type { ReferralActivityRow, ReferralSummary } from "@/types/referral";
import { LoadingBlock } from "@/components/ui/loading-block";
import { cn } from "@/lib/cn";

import {
  referralActivityPanelClass,
  referralClaimButtonClass,
  referralEmptyInviteButtonClass,
  referralEmptyMessageClass,
  referralEmptyStateClass,
  referralEarningsCellClass,
  referralGridTemplateColumns,
  referralSummaryBarClass,
  referralSummaryStatLabelClass,
  referralSummaryStatValueClass,
  referralSummaryStatValueMutedClass,
} from "./referral-ui";

function ActivityTableSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-3 px-[30px]" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <LoadingBlock key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

function SummaryStat({
  value,
  label,
  muted,
}: {
  value: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          referralSummaryStatValueClass,
          muted && referralSummaryStatValueMutedClass,
        )}
      >
        {value}
      </p>
      <p className={referralSummaryStatLabelClass}>{label}</p>
    </div>
  );
}

export type ReferralActivityPanelProps = {
  summary: ReferralSummary;
  needsWallet?: boolean;
  loginInProgress?: boolean;
  onInviteFriends?: () => void;
  onConnectWallet?: () => void;
};

export function ReferralActivityPanel({
  summary,
  needsWallet = false,
  loginInProgress = false,
  onInviteFriends,
  onConnectWallet,
}: ReferralActivityPanelProps) {
  const t = useTranslations("referral");
  const [page, setPage] = useState(1);
  const { claim, isPending } = useReferralClaim();

  const activityColumns = useMemo<GridTableColumn<ReferralActivityRow>[]>(
    () => [
      {
        id: "user",
        header: t("tableUser"),
        renderCell: (row) => row.user,
      },
      {
        id: "txId",
        header: t("tableTxId"),
        renderCell: (row) => row.txId,
      },
      {
        id: "time",
        header: t("tableTime"),
        renderCell: (row) => row.time,
      },
      {
        id: "market",
        header: t("tableMarket"),
        renderCell: (row) => row.market,
      },
      {
        id: "value",
        header: t("tableValue"),
        renderCell: (row) => row.value,
      },
      {
        id: "earnings",
        header: t("tableEarnings"),
        align: "right",
        cellClassName: referralEarningsCellClass,
        headerClassName: referralEarningsCellClass,
        renderCell: (row) => row.earnings,
      },
    ],
    [t],
  );

  const {
    rows: apiRows,
    total: apiTotal,
    isLoading: invitesLoading,
  } = useReferralInvites(page, REFERRAL_ACTIVITY_PAGE_SIZE);

  const activityRows = apiRows;
  const activityTotalCount = apiTotal;
  const isEmpty = !invitesLoading && activityTotalCount === 0;
  const muted = isEmpty;
  const showClaimTooltip = !summary.canClaim && !isPending;

  const claimButton = (
    <button
      type="button"
      disabled={!summary.canClaim || isPending}
      className={referralClaimButtonClass}
      onClick={() => claim()}
    >
      {isPending ? t("claiming") : t("claim")}
    </button>
  );

  return (
    <>
      <section className={referralActivityPanelClass} aria-label={t("referralActivity")}>
        <div className={referralSummaryBarClass}>
          <SummaryStat
            value={summary.myReferrals}
            label={t("myReferrals")}
            muted={muted}
          />
          <SummaryStat
            value={summary.totalVolume}
            label={t("totalVolume")}
            muted={muted}
          />
          <SummaryStat
            value={summary.myEarnings}
            label={t("myEarnings")}
            muted={muted}
          />
          <SummaryStat
            value={summary.toBeClaimed}
            label={t("toBeClaimedLabel")}
            muted={muted}
          />
          {showClaimTooltip ? (
            <Popover
              trigger="Hover"
              placement="Top"
              offset={10}
              triggerContainerClassName="w-[152px] shrink-0 max-md:w-full"
              contentStyle={{ pointerEvents: "none" }}
              content={
                <div className="rounded-[12px] border border-prophet-line bg-prophet-panel px-4 py-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
                  <p className="m-0 text-[14px] leading-[normal] text-prophet-foreground">
                    {t("claimAvailableTooltip", {
                      minAmount: `$${REFERRAL_CLAIM_MIN_AMOUNT}`,
                    })}
                  </p>
                </div>
              }
            >
              {claimButton}
            </Popover>
          ) : (
            claimButton
          )}
        </div>

        {invitesLoading ? (
          <ActivityTableSkeleton />
        ) : (
          <GridTable
            columns={activityColumns}
            rows={isEmpty ? [] : activityRows}
            getRowKey={(row) => row.id}
            gridTemplateColumns={referralGridTemplateColumns}
            ariaLabel={t("referralRewardsActivity")}
            className="mt-4"
          />
        )}

        {isEmpty && !invitesLoading && (
          <div className={referralEmptyStateClass}>
            <p className={referralEmptyMessageClass}>
              {needsWallet
                ? t("connectWalletToViewActivity")
                : t("noRewardsFound")}
            </p>
            <button
              type="button"
              className={referralEmptyInviteButtonClass}
              disabled={needsWallet && loginInProgress}
              onClick={needsWallet ? onConnectWallet : onInviteFriends}
            >
              {needsWallet
                ? loginInProgress
                  ? t("connecting")
                  : t("connectWallet")
                : t("inviteFriends")}
            </button>
          </div>
        )}
      </section>
      {
        !isEmpty && !invitesLoading && (
          <Pagination
            page={page}
            pageSize={REFERRAL_ACTIVITY_PAGE_SIZE}
            total={activityTotalCount}
            onPageChange={setPage}
            className="py-1 px-2"
          />
        )
      }
    </>
  );
}
