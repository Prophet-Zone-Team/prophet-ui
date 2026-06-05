"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/context/auth/use-auth";
import {
  referralPageContent,
  referralPageContentEmpty,
} from "@/data/mock/referral";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";
import { referralGuestContent } from "@/lib/referral/guest-content";
import { REFERRAL_USE_EMPTY_STATE } from "@/lib/referral/config";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";

import { InviteFriendsModal } from "./invite-friends-modal";
import { ReferralShell } from "./referral-shell";
import { ReferralShellSkeleton } from "./referral-shell-skeleton";

export function ReferralPage() {
  const searchParams = useSearchParams();
  const authHydrated = useAuthHydrated();
  const { session, isAuthenticated, openLogin, loginInProgress } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const useEmpty =
    REFERRAL_USE_EMPTY_STATE || searchParams.get("empty") === "1";

  const mockContent = useMemo(
    () => (useEmpty ? referralPageContentEmpty : referralPageContent),
    [useEmpty],
  );

  const {
    content: apiContent,
    isLoading,
    isError,
    refetch,
  } = useProphetReferral();

  const needsWallet = authHydrated && !useEmpty && !isAuthenticated;

  const handleConnectWallet = useCallback(async () => {
    await openLogin();
  }, [openLogin]);

  if (!useEmpty && !authHydrated) {
    return (
      <div className={portfolioPageClass}>
        <ReferralShellSkeleton />
      </div>
    );
  }

  if (needsWallet) {
    return (
      <div className={portfolioPageClass}>
        <ReferralShell
          rewards={referralGuestContent.rewards}
          kickback={referralGuestContent.kickback}
          summary={referralGuestContent.summary}
          needsWallet
          apiEnabled={false}
          loginInProgress={loginInProgress}
          onConnectWallet={() => void handleConnectWallet()}
        />
      </div>
    );
  }

  const apiEnabled = !useEmpty;
  const rewards = useEmpty ? mockContent.referral.rewards : apiContent?.rewards;
  const kickback = useEmpty ? mockContent.referral.kickback : apiContent?.kickback;
  const summary = useEmpty ? mockContent.referral.summary : apiContent?.summary;
  const funderAddress = session?.funderAddress;

  if (!useEmpty && isLoading) {
    return (
      <div className={portfolioPageClass}>
        <ReferralShellSkeleton />
      </div>
    );
  }

  if (!useEmpty && isError) {
    return (
      <div className={portfolioPageClass}>
        <div className="flex flex-col items-center gap-3 pt-[34px] text-[14px] text-[#909090]">
          <p>Unable to load referral data.</p>
          <button
            type="button"
            className="text-black underline-offset-2 hover:underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!rewards || !kickback || !summary) {
    return (
      <div className={portfolioPageClass}>
        <ReferralShellSkeleton />
      </div>
    );
  }

  return (
    <div className={portfolioPageClass}>
      <ReferralShell
        rewards={rewards}
        kickback={kickback}
        summary={summary}
        apiEnabled={apiEnabled}
        mockActivityRows={useEmpty ? mockContent.referral.activityRows : undefined}
        mockActivityTotalCount={
          useEmpty ? mockContent.referral.activityTotalCount : undefined
        }
        onInviteFriends={() => setInviteOpen(true)}
      />

      <InviteFriendsModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        kickback={kickback}
        funderAddress={funderAddress}
      />
    </div>
  );
}
