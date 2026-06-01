import { cn } from "@/lib/cn";
import type { ReferralActivityRow } from "@/types/referral";
import { portfolioActionButtonClass } from "@/views/portfolio/portfolio-ui";

import {
  referralActivityCardClass,
  referralClaimMetaClass,
  referralClaimRowClass,
  referralOrderIdClass,
  referralSectionTitleClass,
  referralStatusCompleteClass,
  referralTableCellClass,
  referralTableClass,
  referralTableBodyClass,
  referralTableHeadClass,
  referralTableWrapClass,
} from "./referral-ui";

interface ReferralActivityProps {
  rows: ReferralActivityRow[];
  claimMeta: string;
}

export function ReferralActivity({ rows, claimMeta }: ReferralActivityProps) {
  return (
    <section className={referralActivityCardClass} aria-labelledby="activity-title">
      <h2 className={referralSectionTitleClass} id="activity-title">
        Recent Referred Activity
      </h2>
      <div className={referralTableWrapClass}>
        <table className={referralTableClass}>
          <thead>
            <tr>
              <th className={referralTableHeadClass}>User</th>
              <th className={referralTableHeadClass}>Order ID</th>
              <th className={referralTableHeadClass}>Market</th>
              <th className={referralTableHeadClass}>Order Type</th>
              <th className={referralTableHeadClass}>Order Volume</th>
              <th className={referralTableHeadClass}>Prophet Fee</th>
              <th className={referralTableHeadClass}>Kickback Rate</th>
              <th className={referralTableHeadClass}>Your Reward</th>
              <th className={referralTableHeadClass}>Status</th>
              <th className={referralTableHeadClass}>Time</th>
            </tr>
          </thead>
          <tbody className={referralTableBodyClass}>
            {rows.map((row) => (
              <tr key={row.orderId}>
                <td className={referralTableCellClass}>{row.user}</td>
                <td className={cn(referralTableCellClass, referralOrderIdClass)}>{row.orderId}</td>
                <td className={referralTableCellClass}>{row.market}</td>
                <td className={referralTableCellClass}>{row.orderType}</td>
                <td className={referralTableCellClass}>{row.orderVolume}</td>
                <td className={referralTableCellClass}>{row.prophetFee}</td>
                <td className={referralTableCellClass}>{row.kickbackRate}</td>
                <td className={referralTableCellClass}>{row.reward}</td>
                <td className={cn(referralTableCellClass, referralStatusCompleteClass)}>
                  {row.status}
                </td>
                <td className={referralTableCellClass}>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={referralClaimRowClass}>
        <button
          type="button"
          className={cn(
            portfolioActionButtonClass,
            "h-[42px] w-full max-w-[280px] text-sm",
          )}
        >
          Claim Rewards
        </button>
        <span className={referralClaimMetaClass}>{claimMeta}</span>
      </div>
    </section>
  );
}
