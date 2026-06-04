export const referralQueryKeys = {
  detail: ["referral", "detail"] as const,
  invites: (page: number, pageSize: number) =>
    ["referral", "invites", page, pageSize] as const,
  invitesRoot: ["referral", "invites"] as const
};
