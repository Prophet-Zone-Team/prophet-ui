import { REFERRAL_PATH, REFERRAL_QUERY_PARAM } from "@/lib/referral/config";

function resolveOrigin(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.origin;
}

export function buildReferralLink(referralCode: string): string {
  const origin = resolveOrigin();

  if (!origin || !referralCode) {
    return "";
  }

  const params = new URLSearchParams({ [REFERRAL_QUERY_PARAM]: referralCode });
  return `${origin}${REFERRAL_PATH}?${params.toString()}`;
}

export function buildReferralLinkParts(referralCode: string): {
  linkPrefix: string;
  referralCode: string;
  fullLink: string;
} {
  const origin = resolveOrigin();
  const linkPrefix = origin
    ? `${origin}${REFERRAL_PATH}?${REFERRAL_QUERY_PARAM}=`
    : `${REFERRAL_PATH}?${REFERRAL_QUERY_PARAM}=`;

  return {
    linkPrefix,
    referralCode,
    fullLink: buildReferralLink(referralCode)
  };
}
