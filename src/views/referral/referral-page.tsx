"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import {
  referralPageContent,
  referralPageContentEmpty,
} from "@/data/mock/referral";
import { REFERRAL_USE_EMPTY_STATE } from "@/lib/referral/config";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";

import { ReferralShell } from "./referral-shell";

function noopInviteFriends() {
  return undefined;
}

export function ReferralPage() {
  const searchParams = useSearchParams();
  const useEmpty =
    REFERRAL_USE_EMPTY_STATE || searchParams.get("empty") === "1";

  const content = useMemo(
    () => (useEmpty ? referralPageContentEmpty : referralPageContent),
    [useEmpty],
  );

  return (
    <div className={portfolioPageClass}>
      <ReferralShell
        referral={content.referral}
        onInviteFriends={noopInviteFriends}
      />
    </div>
  );
}
