"use client";

import { isPrivateModeHost } from "@/config/funding";
import { isInTokenPocket } from "@/context/rainbowkit/utils";
import {
  TP_FUNDING_SWITCH_EVENT,
  TP_FUNDING_SWITCH_FLAG_KEY,
  TP_FUNDING_SWITCH_FLAG_TTL_MS,
  TP_REDIRECT_STORAGE_KEY,
} from "@/lib/wallet/tokenpocket/constants";

export type TpHostKind = "main" | "private";

export interface TpFundingSwitchFlag {
  startedAt: number;
  blockchain: string;
  hostname: string;
  hostKind: TpHostKind;
}

export interface TpRedirectContext {
  redirectPath: string;
  hostname: string;
  hostKind: TpHostKind;
}

export interface TpFundingSwitchCompleteDetail {
  hostKind: TpHostKind;
  blockchain?: string;
  redirectPath?: string;
}

export function resolveTpHostKind(hostname: string): TpHostKind {
  return isPrivateModeHost(hostname) ? "private" : "main";
}

export function setTpFundingSwitchFlag(blockchain: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const hostname = window.location.hostname;
  const payload: TpFundingSwitchFlag = {
    startedAt: Date.now(),
    blockchain,
    hostname,
    hostKind: resolveTpHostKind(hostname),
  };

  sessionStorage.setItem(TP_FUNDING_SWITCH_FLAG_KEY, JSON.stringify(payload));
}

export function getTpFundingSwitchFlag(): TpFundingSwitchFlag | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = sessionStorage.getItem(TP_FUNDING_SWITCH_FLAG_KEY);

  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TpFundingSwitchFlag>;

    if (
      typeof parsed.startedAt !== "number" ||
      typeof parsed.blockchain !== "string" ||
      typeof parsed.hostname !== "string" ||
      (parsed.hostKind !== "main" && parsed.hostKind !== "private")
    ) {
      sessionStorage.removeItem(TP_FUNDING_SWITCH_FLAG_KEY);
      return undefined;
    }

    if (Date.now() - parsed.startedAt > TP_FUNDING_SWITCH_FLAG_TTL_MS) {
      sessionStorage.removeItem(TP_FUNDING_SWITCH_FLAG_KEY);
      return undefined;
    }

    return parsed as TpFundingSwitchFlag;
  } catch {
    sessionStorage.removeItem(TP_FUNDING_SWITCH_FLAG_KEY);
    return undefined;
  }
}

export function clearTpFundingSwitchFlag(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(TP_FUNDING_SWITCH_FLAG_KEY);
}

export function isTokenPocketFundingSwitchGracePeriod(hasTradingSession: boolean): boolean {
  if (typeof window === "undefined" || !hasTradingSession) {
    return false;
  }

  if (!isInTokenPocket()) {
    return false;
  }

  if (isPrivateModeHost(window.location.hostname)) {
    return false;
  }

  return Boolean(getTpFundingSwitchFlag());
}

export function saveTpRedirectContext(): void {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname ?? "";
  const queryString = window.location.search ?? "";
  const redirectPath = `${pathname}${queryString}`;

  if (!redirectPath) {
    return;
  }

  const hostname = window.location.hostname;
  const payload: TpRedirectContext = {
    redirectPath,
    hostname,
    hostKind: resolveTpHostKind(hostname),
  };

  localStorage.setItem(TP_REDIRECT_STORAGE_KEY, JSON.stringify(payload));
}

export function getTpRedirectContext(): TpRedirectContext | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = localStorage.getItem(TP_REDIRECT_STORAGE_KEY);

  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TpRedirectContext>;

    if (
      typeof parsed.redirectPath === "string" &&
      typeof parsed.hostname === "string" &&
      (parsed.hostKind === "main" || parsed.hostKind === "private")
    ) {
      return parsed as TpRedirectContext;
    }
  } catch {
    // Fall through to legacy string format.
  }

  if (raw.startsWith("/")) {
    const hostname = window.location.hostname;
    return {
      redirectPath: raw,
      hostname,
      hostKind: resolveTpHostKind(hostname),
    };
  }

  return undefined;
}

export function clearTpRedirectContext(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TP_REDIRECT_STORAGE_KEY);
}

export function dispatchTpFundingSwitchComplete(
  detail: TpFundingSwitchCompleteDetail,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<TpFundingSwitchCompleteDetail>(TP_FUNDING_SWITCH_EVENT, {
      detail,
    }),
  );
}

export class TpFundingSwitchPendingError extends Error {
  readonly reloadPending = true;

  readonly blockchain: string;

  readonly hostKind: TpHostKind;

  constructor(blockchain: string, hostKind: TpHostKind) {
    super(buildTpFundingSwitchPendingMessage(blockchain, hostKind));
    this.name = "TpFundingSwitchPendingError";
    this.blockchain = blockchain;
    this.hostKind = hostKind;
  }
}

export function buildTpFundingSwitchPendingMessage(
  blockchain: string,
  hostKind: TpHostKind,
): string {
  const walletLabel =
    blockchain === "solana"
      ? "Solana"
      : blockchain === "tron"
        ? "Tron"
        : blockchain === "matic"
          ? "Polygon"
          : blockchain;

  if (hostKind === "main") {
    return `Switching to the ${walletLabel} wallet in TokenPocket. Your login will be preserved after the page reloads. Tap Connect wallet again to continue.`;
  }

  return `Switching to the ${walletLabel} wallet in TokenPocket. Tap Connect wallet again after the page reloads.`;
}

export function isTpFundingSwitchPendingError(
  error: unknown,
): error is TpFundingSwitchPendingError {
  return error instanceof TpFundingSwitchPendingError;
}
