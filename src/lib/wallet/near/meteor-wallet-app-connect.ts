import { getNearAccountSnapshot } from "./near-account-store";
import { NEAR_SIGN_IN_CONTRACT_ID } from "./near-config";

export const METEOR_WALLET_APP_ID = "meteor-wallet-app";

const CONNECT_POLL_MS = 200;
const CONNECT_TIMEOUT_MS = 5_000;

type MeteorWebViewWindow = Window & {
  ReactNativeWebView?: {
    postMessage?: (message: string) => void;
  };
};

/** Meteor Wallet mobile app exposes the same WebView bridge used by meteor-wallet-app. */
export function isInMeteorWalletApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const meteorWindow = window as MeteorWebViewWindow;
  return typeof meteorWindow.ReactNativeWebView?.postMessage === "function";
}

export function getActiveSelectorAccountId(): string | null {
  const { selector } = getNearAccountSnapshot();

  if (!selector) {
    return null;
  }

  return (
    selector.store
      .getState()
      .accounts.find((account) => account.active)?.accountId ?? null
  );
}

function hasNearWalletConnection(): boolean {
  return Boolean(getNearAccountSnapshot().accountId || getActiveSelectorAccountId());
}

async function waitForNearWalletConnection(
  timeoutMs = CONNECT_TIMEOUT_MS,
): Promise<boolean> {
  if (hasNearWalletConnection()) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let pollId = 0;
    let timeoutId = 0;
    let subscription: { unsubscribe: () => void } | undefined;

    const finish = (connected: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      subscription?.unsubscribe();
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      resolve(connected);
    };

    subscription = getNearAccountSnapshot().selector?.store.observable.subscribe(() => {
      if (hasNearWalletConnection()) {
        finish(true);
      }
    });

    pollId = window.setInterval(() => {
      if (hasNearWalletConnection()) {
        finish(true);
      }
    }, CONNECT_POLL_MS);

    timeoutId = window.setTimeout(() => {
      finish(hasNearWalletConnection());
    }, timeoutMs);
  });
}

/**
 * Re-triggers Meteor Wallet App in-app browser sign-in via postMessage.
 * `runOnStartup` only runs once during selector setup; after signOut the dApp
 * must call signIn again before opening the wallet modal.
 */
export async function tryConnectMeteorWalletApp(): Promise<boolean> {
  if (!isInMeteorWalletApp()) {
    return false;
  }

  const { selector } = getNearAccountSnapshot();

  if (!selector || hasNearWalletConnection()) {
    return hasNearWalletConnection();
  }

  try {
    const wallet = await selector.wallet(METEOR_WALLET_APP_ID);
    await wallet.signIn({ contractId: NEAR_SIGN_IN_CONTRACT_ID });
    return waitForNearWalletConnection();
  } catch {
    return false;
  }
}

/**
 * meteor-wallet-app auto-connect (`runOnStartup`) only runs on full page load.
 * After signOut the in-app WebView bridge can stop responding until reload.
 */
export function reloadPageAfterMeteorNearLogout(): void {
  if (isInMeteorWalletApp()) {
    window.location.reload();
  }
}
