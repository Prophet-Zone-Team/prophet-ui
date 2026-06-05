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
  needsWallet?: boolean;
  loginInProgress?: boolean;
  mockActivityRows?: ReferralActivityRow[];
  mockActivityTotalCount?: number;
  onInviteFriends?: () => void;
  onConnectWallet?: () => void;
};

export function ReferralShell({
  rewards,
  kickback,
  summary,
  apiEnabled = true,
  needsWallet = false,
  loginInProgress = false,
  mockActivityRows,
  mockActivityTotalCount,
  onInviteFriends,
  onConnectWallet,
}: ReferralShellProps) {
  return (
    <section className={referralShellClass} aria-label="Referral program">
      <div className={referralTopGridClass}>
        <ReferralRewardsCard rewards={rewards} />
        <ReferralKickbackCard
          kickback={kickback}
          needsWallet={needsWallet}
          loginInProgress={loginInProgress}
          onInviteFriends={onInviteFriends}
          onConnectWallet={onConnectWallet}
        />
      </div>

      <ReferralActivityPanel
        summary={summary}
        apiEnabled={apiEnabled}
        needsWallet={needsWallet}
        loginInProgress={loginInProgress}
        mockActivityRows={mockActivityRows}
        mockActivityTotalCount={mockActivityTotalCount}
        onInviteFriends={onInviteFriends}
        onConnectWallet={onConnectWallet}
      />
    </section>
  );
}
