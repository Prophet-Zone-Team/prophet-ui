"use client";

import { useState } from "react";

import { GridTable } from "@/components/grid-table";
import type { GridTableColumn } from "@/components/grid-table";
import { Pagination } from "@/components/pagination/pagination";
import { useReferralClaim } from "@/hooks/referral/use-referral-claim";
import { useReferralInvites } from "@/hooks/referral/use-referral-invites";
import { REFERRAL_ACTIVITY_PAGE_SIZE } from "@/lib/referral/config";
import type { ReferralActivityRow, ReferralSummary } from "@/types/referral";
import { cn } from "@/lib/cn";

import {
  referralActivityPanelClass,
  referralClaimButtonClass,
  referralClaimButtonDisabledClass,
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

const ACTIVITY_COLUMNS: GridTableColumn<ReferralActivityRow>[] = [
  {
    id: "user",
    header: "User",
    renderCell: (row) => row.user,
  },
  {
    id: "txId",
    header: "Tx ID",
    renderCell: (row) => row.txId,
  },
  {
    id: "time",
    header: "Time",
    renderCell: (row) => row.time,
  },
  {
    id: "market",
    header: "Market",
    renderCell: (row) => row.market,
  },
  {
    id: "value",
    header: "Value",
    renderCell: (row) => row.value,
  },
  {
    id: "prophetFee",
    header: "Prophet Fee",
    renderCell: (row) => row.prophetFee,
  },
  {
    id: "earnings",
    header: "Earnings",
    align: "right",
    cellClassName: referralEarningsCellClass,
    headerClassName: referralEarningsCellClass,
    renderCell: (row) => row.earnings,
  },
];

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
  apiEnabled?: boolean;
  mockActivityRows?: ReferralActivityRow[];
  mockActivityTotalCount?: number;
  onInviteFriends?: () => void;
};

export function ReferralActivityPanel({
  summary,
  apiEnabled = true,
  mockActivityRows = [],
  mockActivityTotalCount = 0,
  onInviteFriends,
}: ReferralActivityPanelProps) {
  const [page, setPage] = useState(1);
  const { claim, isPending } = useReferralClaim();

  const {
    rows: apiRows,
    total: apiTotal,
    isLoading: invitesLoading,
  } = useReferralInvites(page, REFERRAL_ACTIVITY_PAGE_SIZE, apiEnabled);

  const activityRows = apiEnabled ? apiRows : mockActivityRows;
  const activityTotalCount = apiEnabled ? apiTotal : mockActivityTotalCount;
  const isEmpty = !invitesLoading && activityTotalCount === 0;
  const muted = isEmpty;
  const showTableSkeleton = apiEnabled && invitesLoading;

  return (
    <section className={referralActivityPanelClass} aria-label="Referral activity">
      <div className={referralSummaryBarClass}>
        <SummaryStat
          value={summary.myReferrals}
          label="My Referrals"
          muted={muted}
        />
        <SummaryStat
          value={summary.totalVolume}
          label="Total Volume"
          muted={muted}
        />
        <SummaryStat
          value={summary.myEarnings}
          label="My Earnings"
          muted={muted}
        />
        <SummaryStat
          value={summary.toBeClaimed}
          label="To be Claimed"
          muted={muted}
        />
        <button
          type="button"
          disabled={!summary.canClaim || isPending || !apiEnabled}
          className={cn(
            referralClaimButtonClass,
            (!summary.canClaim || isPending) && referralClaimButtonDisabledClass,
          )}
          onClick={() => claim()}
        >
          {isPending ? "Claiming…" : "Claim"}
        </button>
      </div>

      {showTableSkeleton ? (
        <ActivityTableSkeleton />
      ) : (
        <GridTable
          columns={ACTIVITY_COLUMNS}
          rows={isEmpty ? [] : activityRows}
          getRowKey={(row) => row.id}
          gridTemplateColumns={referralGridTemplateColumns}
          ariaLabel="Referral rewards activity"
          className="mt-4"
        />
      )}

      {isEmpty && !showTableSkeleton ? (
        <div className={referralEmptyStateClass}>
          <p className={referralEmptyMessageClass}>No rewards found</p>
          <button
            type="button"
            className={referralEmptyInviteButtonClass}
            onClick={onInviteFriends}
          >
            Invite Friends
          </button>
        </div>
      ) : !isEmpty && !showTableSkeleton ? (
        <Pagination
          page={page}
          pageSize={REFERRAL_ACTIVITY_PAGE_SIZE}
          total={activityTotalCount}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}
