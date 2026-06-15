import { hashIdentifier } from "./hash-identifier";
import { trackAnalyticsEvent } from "./track";

export function trackLoginClicked(input?: {
  entrySource?: string;
  label?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "login_clicked",
    ...(input?.entrySource ? { entrySource: input.entrySource } : {}),
    ...(input?.label ? { label: input.label } : {})
  });
}

export function trackWalletConnectStarted(input?: {
  walletType?: string;
  entrySource?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "wallet_connect_started",
    ...(input?.walletType ? { walletType: input.walletType } : {}),
    ...(input?.entrySource ? { entrySource: input.entrySource } : {})
  });
}

export async function trackWalletConnected(input: {
  walletAddress?: string;
  userId?: string;
  walletType?: string;
}): Promise<void> {
  const [walletHash, userIdHash] = await Promise.all([
    input.walletAddress ? hashIdentifier(input.walletAddress) : undefined,
    input.userId ? hashIdentifier(input.userId) : undefined
  ]);

  trackAnalyticsEvent({
    eventName: "wallet_connected",
    ...(walletHash ? { walletHash } : {}),
    ...(userIdHash ? { userIdHash } : {}),
    ...(input.walletType ? { walletType: input.walletType } : {})
  });
}

export function trackWalletConnectFailed(input?: {
  failureReason?: string;
  errorCode?: string;
  walletType?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "wallet_connect_failed",
    ...(input?.failureReason ? { failureReason: input.failureReason } : {}),
    ...(input?.errorCode ? { errorCode: input.errorCode } : {}),
    ...(input?.walletType ? { walletType: input.walletType } : {})
  });
}
