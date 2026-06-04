"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useAuth } from "@/context/auth/use-auth";
import {
  referralPageContent,
  referralPageContentEmpty,
} from "@/data/mock/referral";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";
import { REFERRAL_USE_EMPTY_STATE } from "@/lib/referral/config";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";

import { InviteFriendsModal } from "./invite-friends-modal";
import { ReferralShell } from "./referral-shell";
import { ReferralShellSkeleton } from "./referral-shell-skeleton";

export function ReferralPage() {
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const useEmpty =
    REFERRAL_USE_EMPTY_STATE || searchParams.get("empty") === "1";

  const mockContent = useMemo(
    () => (useEmpty ? referralPageContentEmpty : referralPageContent),
    [useEmpty]
  );

  const {
    content: apiContent,
    isLoading,
    isError,
    refetch,
  } = useProphetReferral();

  const referral = useEmpty ? mockContent.referral : apiContent;
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

  if (!referral) {
    return (
      <div className={portfolioPageClass}>
        <ReferralShellSkeleton />
      </div>
    );
  }

  return (
    <div className={portfolioPageClass}>
      <ReferralShell
        referral={referral}
        onInviteFriends={() => setInviteOpen(true)}
      />

      <InviteFriendsModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        kickback={referral.kickback}
        funderAddress={funderAddress}
      />
    </div>
  );
}
