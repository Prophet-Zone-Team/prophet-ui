import {
  setupWalletSelector,
  type Network,
  type WalletSelector,
} from "@near-wallet-selector/core";
import {
  setupModal,
  type ModalOptions,
  type Theme,
  type WalletSelectorModal,
} from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupIntearWallet } from "@near-wallet-selector/intear-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMeteorWalletApp } from "@near-wallet-selector/meteor-wallet-app";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";
import { setupWalletConnect } from "rhea-wallet-connect";

import { Metadata } from "@/context/rainbowkit/metadata";
import { readResolvedDarkModeFromDocument } from "@/hooks/common/use-resolved-dark-mode";

import { NEAR_NETWORK, NEAR_SIGN_IN_CONTRACT_ID } from "./near-config";

const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID || "";

export interface NearSelectorBundle {
  selector: WalletSelector;
  modal: WalletSelectorModal;
}

export function resolveNearModalTheme(darkModeEnabled: boolean): Theme {
  return darkModeEnabled ? "dark" : "light";
}

/** Mutable options passed by reference into NEAR modal-ui setupModal. */
export const nearModalOptions: ModalOptions = {
  contractId: NEAR_SIGN_IN_CONTRACT_ID,
  theme: resolveNearModalTheme(readResolvedDarkModeFromDocument()),
};

export function setNearWalletModalTheme(darkModeEnabled: boolean): void {
  nearModalOptions.theme = resolveNearModalTheme(darkModeEnabled);
}

/**
 * Builds the NEAR wallet-selector and its modal with the wallets prophet
 * currently supports. Mirrors the stableflow setup; extend the module list
 * here when more NEAR wallets are needed.
 */
export async function createNearSelectorBundle(): Promise<NearSelectorBundle> {
  const selector = await setupWalletSelector({
    network: {
      networkId: NEAR_NETWORK.networkId,
      nodeUrl: NEAR_NETWORK.nodeUrl,
    } as Network,
    fallbackRpcUrls: ["https://free.rpc.fastnear.com", "https://nearinner.deltarpc.com"],
    debug: false,
    modules: [
      setupMyNearWallet(),
      setupHotWallet(),
      setupMeteorWallet(),
      setupMeteorWalletApp({
        contractId: NEAR_SIGN_IN_CONTRACT_ID,
      }),
      setupIntearWallet(),
      setupWalletConnect({
        projectId: WALLET_CONNECT_PROJECT_ID,
        metadata: {
          name: Metadata.name,
          description: Metadata.description,
          url: Metadata.url,
          icons: Metadata.icons,
        },
        chainId: "near:mainnet",
      }),
    ],
  });

  const modal = setupModal(selector, nearModalOptions);

  return { selector, modal };
}
