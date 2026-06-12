import type { MatchOutcomeSide } from "@/types/market";

import { mapSmartWalletOptionsBySide } from "./map-smart-wallet-options";
import type {
  ZettaOutcomeWalletCounts,
  ZettaSmartWalletsResponse
} from "./types";

export async function fetchZettaSmartWallets(
  eventSlug: string,
  signal?: AbortSignal
): Promise<ZettaSmartWalletsResponse> {
  const slug = eventSlug.trim();

  if (!slug) {
    throw new Error("Event slug is required.");
  }

  const url = `https://zetta.prophet.zone/api/events/smart-wallets?event=${encodeURIComponent(slug)}`;
  const response = await fetch(url, {
    signal,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to load smart wallet data (${response.status}).`);
  }

  return (await response.json()) as ZettaSmartWalletsResponse;
}

export function resolveZettaOutcomeWalletCounts(
  payload: ZettaSmartWalletsResponse | undefined,
  outcomeSide: MatchOutcomeSide,
  homeTeamName: string,
  awayTeamName: string
): ZettaOutcomeWalletCounts | undefined {
  if (!payload?.options?.length) {
    return undefined;
  }

  const mapped = mapSmartWalletOptionsBySide(
    payload.options,
    homeTeamName,
    awayTeamName
  );
  const option = mapped[outcomeSide];

  if (!option) {
    return undefined;
  }

  return {
    side: outcomeSide,
    yesSmartWalletCount: option.yes.smart_wallet_count,
    noSmartWalletCount: option.no.smart_wallet_count,
    yesWhaleWalletCount: option.yes.whale_wallet_count,
    noWhaleWalletCount: option.no.whale_wallet_count
  };
}

export function resolveZettaTeamWalletCounts(
  payload: ZettaSmartWalletsResponse | undefined,
  teamName: string
): ZettaOutcomeWalletCounts | undefined {
  if (!payload?.options?.length) {
    return undefined;
  }

  const normalizedTeamName = teamName.trim().toLowerCase();
  const option =
    payload.options.length === 1
      ? payload.options[0]
      : (payload.options.find((item) =>
          item.market_question.toLowerCase().includes(normalizedTeamName)
        ) ?? payload.options[0]);

  return {
    side: "home",
    yesSmartWalletCount: option.yes.smart_wallet_count,
    noSmartWalletCount: option.no.smart_wallet_count,
    yesWhaleWalletCount: option.yes.whale_wallet_count,
    noWhaleWalletCount: option.no.whale_wallet_count
  };
}
