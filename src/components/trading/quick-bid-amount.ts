"use client";

const DEFAULT_QUICK_BID_AMOUNT = "10";
const ACTIVE_WALLET_KEY = "wc_quick_bid_wallet_address";
const LEGACY_AMOUNT_KEY = "wc_quick_bid_amount";
const AMOUNT_CHANGE_EVENT = "wc:quick-bid-amount";

export function getDefaultQuickBidAmount() {
  return DEFAULT_QUICK_BID_AMOUNT;
}

export function readActiveQuickBidWalletAddress() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const value = window.localStorage.getItem(ACTIVE_WALLET_KEY);

  return value && /^0x[a-fA-F0-9]{40}$/.test(value) ? value : undefined;
}

export function writeActiveQuickBidWalletAddress(walletAddress: string | undefined) {
  if (typeof window === "undefined") {
    return;
  }

  if (walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    window.localStorage.setItem(ACTIVE_WALLET_KEY, walletAddress);
  } else {
    window.localStorage.removeItem(ACTIVE_WALLET_KEY);
  }

  notifyQuickBidAmountChanged();
}

export function readQuickBidAmount(walletAddress = readActiveQuickBidWalletAddress()) {
  if (typeof window === "undefined") {
    return DEFAULT_QUICK_BID_AMOUNT;
  }

  const value = walletAddress
    ? window.localStorage.getItem(getWalletAmountKey(walletAddress)) ?? window.localStorage.getItem(LEGACY_AMOUNT_KEY)
    : window.localStorage.getItem(LEGACY_AMOUNT_KEY);

  return isValidAmount(value) ? value : DEFAULT_QUICK_BID_AMOUNT;
}

export function writeQuickBidAmount(value: string, walletAddress = readActiveQuickBidWalletAddress()) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeQuickBidAmount(value);
  const key = walletAddress ? getWalletAmountKey(walletAddress) : LEGACY_AMOUNT_KEY;

  window.localStorage.setItem(key, normalized);
  notifyQuickBidAmountChanged();
}

export function subscribeQuickBidAmountChange(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (
      event.key === ACTIVE_WALLET_KEY ||
      event.key === LEGACY_AMOUNT_KEY ||
      event.key?.startsWith(`${LEGACY_AMOUNT_KEY}:`) === true
    ) {
      callback();
    }
  }

  window.addEventListener(AMOUNT_CHANGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AMOUNT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function formatQuickBidAmount(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_QUICK_BID_AMOUNT;
  }

  return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizeQuickBidAmount(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_QUICK_BID_AMOUNT;
  }

  return Math.min(10_000, Math.max(1, parsed)).toString();
}

function getWalletAmountKey(walletAddress: string) {
  return `${LEGACY_AMOUNT_KEY}:${walletAddress.toLowerCase()}`;
}

function isValidAmount(value: string | null): value is string {
  const parsed = Number(value);

  return Boolean(value && Number.isFinite(parsed) && parsed > 0);
}

function notifyQuickBidAmountChanged() {
  window.dispatchEvent(new Event(AMOUNT_CHANGE_EVENT));
}
