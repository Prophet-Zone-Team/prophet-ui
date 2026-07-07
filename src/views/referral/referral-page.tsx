"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth/use-auth";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";
import { referralGuestContent } from "@/lib/referral/guest-content";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";

import { InviteFriendsModal } from "./invite-friends-modal";
import { ReferralShell } from "./referral-shell";
import { ReferralShellSkeleton } from "./referral-shell-skeleton";

export function ReferralPage() {
  const t = useTranslations("referral");
  const authHydrated = useAuthHydrated();
  const { session, isAuthenticated, openLoginModalOnly, loginInProgress } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const {
    content: apiContent,
    isLoading,
    isError,
    refetch,
  } = useProphetReferral();

  const needsWallet = authHydrated && !isAuthenticated;

  const handleConnectWallet = useCallback(async () => {
    await openLoginModalOnly();
  }, [openLoginModalOnly]);

  if (!authHydrated) {
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
          loginInProgress={loginInProgress}
          onConnectWallet={() => void handleConnectWallet()}
        />
      </div>
    );
  }

  const rewards = apiContent?.rewards;
  const kickback = apiContent?.kickback;
  const summary = apiContent?.summary;
  const funderAddress = session?.funderAddress;

  if (isLoading) {
    return (
      <div className={portfolioPageClass}>
        <ReferralShellSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={portfolioPageClass}>
        <div className="flex flex-col items-center gap-3 pt-[34px] text-[14px] text-prophet-muted">
          <p>{t("loadError")}</p>
          <button
            type="button"
            className="text-prophet-foreground underline-offset-2 hover:underline"
            onClick={() => void refetch()}
          >
            {t("retry")}
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
