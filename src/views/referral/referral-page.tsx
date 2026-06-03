"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useAuth } from "@/context/auth/use-auth";
import {
  referralPageContent,
  referralPageContentEmpty,
} from "@/data/mock/referral";
import { REFERRAL_USE_EMPTY_STATE } from "@/lib/referral/config";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";

import { InviteFriendsModal } from "./invite-friends-modal";
import { ReferralShell } from "./referral-shell";

export function ReferralPage() {
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const useEmpty =
    REFERRAL_USE_EMPTY_STATE || searchParams.get("empty") === "1";

  const content = useMemo(
    () => (useEmpty ? referralPageContentEmpty : referralPageContent),
    [useEmpty],
  );

  const funderAddress = session?.funderAddress;

  return (
    <div className={portfolioPageClass}>
      <ReferralShell
        referral={content.referral}
        onInviteFriends={() => setInviteOpen(true)}
      />

      <InviteFriendsModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        kickback={content.referral.kickback}
        funderAddress={funderAddress}
      />
    </div>
  );
}
