"use client";

import { useEffect, useRef } from "react";
import type { WalletSelector } from "@near-wallet-selector/core";

import "@near-wallet-selector/modal-ui/styles.css";

import {
  registerExternalEvmSigner,
  unregisterExternalEvmSigner,
} from "@/lib/wallet/evm/external-signer-registry";
import { useNearAccountStore } from "@/lib/wallet/near/near-account-store";
import { createNearSelectorBundle } from "@/lib/wallet/near/near-wallet-selector";
import { createNearEvmSigner } from "@/lib/wallet/near/near-evm-signer";
import { deriveV1SignerEvmAddress } from "@/lib/wallet/near/v1-signer";

function getActiveAccountId(selector: WalletSelector): string | null {
  return (
    selector.store
      .getState()
      .accounts.find((account) => account.active)?.accountId ?? null
  );
}

/**
 * Owns the NEAR wallet-selector lifecycle: initializes the selector/modal,
 * tracks the active NEAR account, derives the MPC EVM owner address, and
 * registers an external EVM signer so the shared EVM adapter can sign through
 * the NEAR MPC contract. Kept self-contained to minimize coupling with the
 * wagmi/Privy flows and any parallel wallet integrations.
 */
export function NearProvider({ children }: { children: React.ReactNode }) {
  const lastAccountIdRef = useRef<string | null>(null);
  const registeredAddressRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const clearRegisteredSigner = () => {
      if (registeredAddressRef.current) {
        unregisterExternalEvmSigner(registeredAddressRef.current);
        registeredAddressRef.current = null;
      }
    };

    const syncAccount = async (accountId: string | null) => {
      if (accountId === lastAccountIdRef.current) {
        return;
      }

      lastAccountIdRef.current = accountId;

      if (!accountId) {
        clearRegisteredSigner();
        useNearAccountStore.getState().reset();
        return;
      }

      try {
        const { address } = await deriveV1SignerEvmAddress(accountId);

        if (cancelled || lastAccountIdRef.current !== accountId) {
          return;
        }

        clearRegisteredSigner();
        registerExternalEvmSigner(
          createNearEvmSigner({ address, nearAccountId: accountId }),
        );
        registeredAddressRef.current = address;

        useNearAccountStore.getState().set({
          accountId,
          derivedEvmAddress: address,
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to derive NEAR EVM address:", error);
        }
      }
    };

    const init = async () => {
      try {
        const { selector, modal } = await createNearSelectorBundle();

        if (cancelled) {
          return;
        }

        useNearAccountStore.getState().set({ selector, modal });

        void syncAccount(getActiveAccountId(selector));

        const subscription = selector.store.observable.subscribe(async () => {
          try {
            const accountId = getActiveAccountId(selector);
            const wallet = accountId ? await selector.wallet() : null;

            useNearAccountStore.getState().set({
              walletName: wallet?.metadata.name,
              walletIcon: wallet?.metadata.iconUrl,
            });

            void syncAccount(accountId);
          } catch {
            // Wallet may be mid-transition; the next emission will reconcile.
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        console.error("Failed to initialize NEAR wallet selector:", error);
      }
    };

    void init();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return <>{children}</>;
}
