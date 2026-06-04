import type { ReferralActivityRow, ReferralContent } from "@/types/referral";

import { ReferralActivityPanel } from "./referral-activity-panel";
import { ReferralKickbackCard } from "./referral-kickback-card";
import { ReferralRewardsCard } from "./referral-rewards-card";
import { referralShellClass, referralTopGridClass } from "./referral-ui";

export type ReferralShellProps = {
  rewards: ReferralContent["rewards"];
  kickback: ReferralContent["kickback"];
  summary: ReferralContent["summary"];
  apiEnabled?: boolean;
  mockActivityRows?: ReferralActivityRow[];
  mockActivityTotalCount?: number;
  onInviteFriends?: () => void;
};

export function ReferralShell({
  rewards,
  kickback,
  summary,
  apiEnabled = true,
  mockActivityRows,
  mockActivityTotalCount,
  onInviteFriends,
}: ReferralShellProps) {
  return (
    <section className={referralShellClass} aria-label="Referral program">
      <div className={referralTopGridClass}>
        <ReferralRewardsCard rewards={rewards} />
        <ReferralKickbackCard
          kickback={kickback}
          onInviteFriends={onInviteFriends}
        />
      </div>

      <ReferralActivityPanel
        summary={summary}
        apiEnabled={apiEnabled}
        mockActivityRows={mockActivityRows}
        mockActivityTotalCount={mockActivityTotalCount}
        onInviteFriends={onInviteFriends}
      />
    </section>
  );
}
