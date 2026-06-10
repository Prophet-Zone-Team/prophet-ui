import {
  prophetClient,
  ProphetApiError,
  requireProphetApiToken
} from "@/service/prophet";
import type {
  ProphetApiResponse,
  ProphetReferralClaimData,
  ProphetReferralInvitesData,
  ProphetReferralInvitesParams
} from "@/types/prophet-api";

export function unwrapProphetResponse<T>(payload: ProphetApiResponse<T>): T {
  if (payload.code !== 0) {
    throw new ProphetApiError(
      payload.code,
      payload.message || "Prophet API request failed."
    );
  }

  return payload.data;
}

/** POST /v1/user/referral/claim */
export async function fetchReferralClaim(): Promise<ProphetReferralClaimData> {
  requireProphetApiToken();
  const response = await prophetClient.post<
    ProphetApiResponse<ProphetReferralClaimData>
  >("/v1/user/referral/claim");
  return unwrapProphetResponse(response.data);
}

/** GET /v1/user/referral/invites */
export async function fetchReferralInvites(
  params: ProphetReferralInvitesParams
): Promise<ProphetReferralInvitesData> {
  requireProphetApiToken();
  const response = await prophetClient.get<
    ProphetApiResponse<ProphetReferralInvitesData>
  >("/v1/user/referral/invites", {
    params: {
      page: params.page,
      page_size: params.page_size
    }
  });
  return unwrapProphetResponse(response.data);
}
