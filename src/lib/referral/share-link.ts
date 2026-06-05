import { REFERRAL_PATH } from "@/lib/referral/config";
import { buildReferralLinkParts } from "@/lib/referral/referral-link";
import type { ReferralKickback } from "@/types/referral";

export type ResolvedShareInviteLink = {
  linkPrefix: string;
  referralCode: string;
  fullLink: string;
  displayLink: string;
};

function resolveOrigin(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.origin;
}

export function resolveShareInviteLink(
  kickback?: Pick<ReferralKickback, "linkPrefix" | "referralCode" | "fullLink">,
): ResolvedShareInviteLink {
  if (kickback?.referralCode) {
    return {
      linkPrefix: kickback.linkPrefix,
      referralCode: kickback.referralCode,
      fullLink: kickback.fullLink,
      displayLink: kickback.fullLink,
    };
  }

  const origin = resolveOrigin();
  const fullLink = origin ? `${origin}${REFERRAL_PATH}` : REFERRAL_PATH;

  return {
    linkPrefix: fullLink,
    referralCode: "",
    fullLink,
    displayLink: fullLink,
  };
}

export function resolveShareInviteLinkFromCode(
  referralCode?: string,
): ResolvedShareInviteLink {
  if (!referralCode) {
    return resolveShareInviteLink();
  }

  const parts = buildReferralLinkParts(referralCode);

  return {
    ...parts,
    displayLink: parts.fullLink,
  };
}
