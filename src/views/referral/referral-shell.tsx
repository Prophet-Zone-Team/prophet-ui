import type { ReferralContent } from "@/types/referral";

import { ReferralActivityPanel } from "./referral-activity-panel";
import { ReferralKickbackCard } from "./referral-kickback-card";
import { ReferralRewardsCard } from "./referral-rewards-card";
import { referralShellClass, referralTopGridClass } from "./referral-ui";

export type ReferralShellProps = {
  referral: ReferralContent;
  onInviteFriends?: () => void;
};

export function ReferralShell({ referral, onInviteFriends }: ReferralShellProps) {
  return (
    <section className={referralShellClass} aria-label="Referral program">
      <div className={referralTopGridClass}>
        <ReferralRewardsCard rewards={referral.rewards} />
        <ReferralKickbackCard
          kickback={referral.kickback}
          onInviteFriends={onInviteFriends}
        />
      </div>

      <ReferralActivityPanel
        summary={referral.summary}
        activityRows={referral.activityRows}
        activityTotalCount={referral.activityTotalCount}
        onInviteFriends={onInviteFriends}
      />
    </section>
  );
}
