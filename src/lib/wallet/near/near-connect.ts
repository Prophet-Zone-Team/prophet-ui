import { getNearAccountSnapshot, useNearAccountStore } from "./near-account-store";
import { setNearWalletModalTheme } from "./near-wallet-selector";

const DEFAULT_CONNECT_TIMEOUT_MS = 120_000;
const CONNECT_POLL_MS = 200;

export function isNearConnected(): boolean {
  const { accountId, derivedEvmAddress } = getNearAccountSnapshot();
  return Boolean(accountId && derivedEvmAddress);
}

export function getNearDerivedEvmAddress(): string | null {
  return getNearAccountSnapshot().derivedEvmAddress;
}

export function openNearWalletModal(darkModeEnabled?: boolean): void {
  const { modal } = getNearAccountSnapshot();

  if (!modal) {
    throw new Error("NEAR wallet selector is not ready yet. Try again shortly.");
  }

  if (typeof darkModeEnabled === "boolean") {
    setNearWalletModalTheme(darkModeEnabled);
  }

  modal.show();
}

/**
 * Resolves once a NEAR account is connected and its EVM owner address has been
 * derived by the provider. Rejects on timeout so callers can surface an error.
 */
export function waitForNearDerivedAddress(
  timeoutMs = DEFAULT_CONNECT_TIMEOUT_MS,
): Promise<string> {
  const existing = getNearDerivedEvmAddress();

  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const finish = (address: string | null, error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribe();
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);

      if (address) {
        resolve(address);
        return;
      }

      reject(error ?? new Error("Timed out connecting the NEAR wallet."));
    };

    const unsubscribe = useNearAccountStore.subscribe((state) => {
      if (state.derivedEvmAddress) {
        finish(state.derivedEvmAddress);
      }
    });

    const pollId = window.setInterval(() => {
      const address = getNearDerivedEvmAddress();

      if (address) {
        finish(address);
      }
    }, CONNECT_POLL_MS);

    const timeoutId = window.setTimeout(() => {
      finish(null);
    }, timeoutMs);
  });
}

export async function connectNearAndDeriveAddress(
  timeoutMs?: number,
): Promise<string> {
  useNearAccountStore.getState().set({ evmDerivationRequested: true });

  try {
    const { accountId } = getNearAccountSnapshot();

    if (!accountId) {
      openNearWalletModal();
    }

    return await waitForNearDerivedAddress(timeoutMs);
  } finally {
    useNearAccountStore.getState().set({ evmDerivationRequested: false });
  }
}

export async function disconnectNearWallet(): Promise<void> {
  const { selector } = getNearAccountSnapshot();

  if (!selector) {
    return;
  }

  try {
    const wallet = await selector.wallet();
    await wallet.signOut();
  } catch {
    // Wallet may already be disconnected; the provider subscription resets state.
  }
}
