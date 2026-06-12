import type { MatchOutcomeSide } from "@/types/market";

import {
  mapSmartWalletOptionsBySide,
  resolveZettaEventTeamNames
} from "./map-smart-wallet-options";
import type {
  ZettaMetricCounts,
  ZettaOutcomeWalletCounts,
  ZettaSmartWalletOption,
  ZettaSmartWalletsResponse
} from "./types";

function isFiniteCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function resolveZettaMetricCounts(
  yesValue: unknown,
  noValue: unknown
): ZettaMetricCounts | undefined {
  const yesDefined = isFiniteCount(yesValue);
  const noDefined = isFiniteCount(noValue);

  if (!yesDefined && !noDefined) {
    return undefined;
  }

  return {
    yesCount: yesDefined ? yesValue : 0,
    noCount: noDefined ? noValue : 0
  };
}

function resolveOptionWalletCounts(
  option: ZettaSmartWalletOption,
  side: MatchOutcomeSide
): ZettaOutcomeWalletCounts | undefined {
  const counts: ZettaOutcomeWalletCounts = {
    side,
    smartWallet: resolveZettaMetricCounts(
      option.yes.smart_wallet_count,
      option.no.smart_wallet_count
    ),
    bigWhale: resolveZettaMetricCounts(
      option.yes.whale_wallet_count,
      option.no.whale_wallet_count
    )
  };

  if (!counts.smartWallet && !counts.bigWhale) {
    return undefined;
  }

  return counts;
}

export async function fetchZettaSmartWallets(
  eventSlug: string,
  signal?: AbortSignal
): Promise<ZettaSmartWalletsResponse> {
  const slug = eventSlug.trim();

  if (!slug) {
    throw new Error("Event slug is required.");
  }

  const url = `/api/zetta/smart-wallets?event=${encodeURIComponent(slug)}`;
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
  fallbackHomeTeamName: string,
  fallbackAwayTeamName: string
): ZettaOutcomeWalletCounts | undefined {
  if (!payload?.options?.length) {
    return undefined;
  }

  const { homeTeamName, awayTeamName } = resolveZettaEventTeamNames(
    payload.event.title,
    fallbackHomeTeamName,
    fallbackAwayTeamName
  );
  const mapped = mapSmartWalletOptionsBySide(
    payload.options,
    homeTeamName,
    awayTeamName
  );
  const option = mapped[outcomeSide];

  if (!option) {
    return undefined;
  }

  return resolveOptionWalletCounts(option, outcomeSide);
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

  return resolveOptionWalletCounts(option, "home");
}
