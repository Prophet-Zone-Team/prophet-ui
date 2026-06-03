"use client";

import { useMemo, useState } from "react";

import { GridTable } from "@/components/grid-table";
import type { GridTableColumn } from "@/components/grid-table";
import { Pagination } from "@/components/pagination/pagination";
import { REFERRAL_ACTIVITY_PAGE_SIZE } from "@/lib/referral/config";
import type { ReferralActivityRow, ReferralContent } from "@/types/referral";
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
  summary: ReferralContent["summary"];
  activityRows: ReferralActivityRow[];
  activityTotalCount: number;
  onInviteFriends?: () => void;
};

export function ReferralActivityPanel({
  summary,
  activityRows,
  activityTotalCount,
  onInviteFriends,
}: ReferralActivityPanelProps) {
  const [page, setPage] = useState(1);
  const isEmpty = activityRows.length === 0;
  const muted = isEmpty;

  const pagedRows = useMemo(() => {
    const start = (page - 1) * REFERRAL_ACTIVITY_PAGE_SIZE;
    return activityRows.slice(start, start + REFERRAL_ACTIVITY_PAGE_SIZE);
  }, [activityRows, page]);

  const paginationTotal = isEmpty ? 0 : activityTotalCount;

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
          disabled={!summary.canClaim}
          className={cn(
            referralClaimButtonClass,
            !summary.canClaim && referralClaimButtonDisabledClass,
          )}
        >
          Claim
        </button>
      </div>

      <GridTable
        columns={ACTIVITY_COLUMNS}
        rows={isEmpty ? [] : pagedRows}
        getRowKey={(row) => row.id}
        gridTemplateColumns={referralGridTemplateColumns}
        ariaLabel="Referral rewards activity"
        className="mt-4"
      />

      {isEmpty ? (
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
      ) : (
        <Pagination
          page={page}
          pageSize={REFERRAL_ACTIVITY_PAGE_SIZE}
          total={paginationTotal}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
