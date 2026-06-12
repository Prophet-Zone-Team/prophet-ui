"use client";

import { useTranslations } from "next-intl";

import type { ReferralContent } from "@/types/referral";

import { ReferralActivityPanel } from "./referral-activity-panel";
import { ReferralKickbackCard } from "./referral-kickback-card";
import { ReferralRewardsCard } from "./referral-rewards-card";
import { referralShellClass, referralTopGridClass } from "./referral-ui";

export type ReferralShellProps = {
  rewards: ReferralContent["rewards"];
  kickback: ReferralContent["kickback"];
  summary: ReferralContent["summary"];
  needsWallet?: boolean;
  loginInProgress?: boolean;
  onInviteFriends?: () => void;
  onConnectWallet?: () => void;
};

export function ReferralShell({
  rewards,
  kickback,
  summary,
  needsWallet = false,
  loginInProgress = false,
  onInviteFriends,
  onConnectWallet,
}: ReferralShellProps) {
  const t = useTranslations("referral");

  return (
    <section className={referralShellClass} aria-label={t("referralProgram")}>
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
        needsWallet={needsWallet}
        loginInProgress={loginInProgress}
        onInviteFriends={onInviteFriends}
        onConnectWallet={onConnectWallet}
      />
    </section>
  );
}
