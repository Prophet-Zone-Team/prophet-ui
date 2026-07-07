"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useConnectModal as useRainbowkitConnectModal } from "@rainbow-me/rainbowkit";

import { useDevice } from "@/hooks/common/use-device";

import { connectInAppBrowserWallet } from "@/lib/wallet/evm/connect-in-app-browser";

import {
  isInMobileBrowser,
  isInWalletInAppBrowser,
  openBinanceWallet,
  openMetaMaskWallet,
  openOkxWallet,
  openTokenPocket,
} from "../utils";
import { launchWalletApp, WalletSelectorModal } from "./wallet-selector";

export interface ConnectModal {
  connectModalOpen: boolean;
  openConnectModal: () => void;
}

export const ConnectModalContext = createContext<ConnectModal>({
  connectModalOpen: false,
  openConnectModal: () => undefined,
});

export function ConnectModalProvider({ children }: { children: React.ReactNode }) {
  const {
    connectModalOpen: rainbowkitConnectModalOpen,
    openConnectModal: rainbowkitOpenConnectModal,
  } = useRainbowkitConnectModal();
  const isMobile = useDevice();

  const isMobileBrowser = useMemo(() => {
    return isInMobileBrowser() && isMobile;
  }, [isMobile]);

  const [isOpenWalletApp, setIsOpenWalletApp] = useState(false);

  useEffect(() => {
    const isOpenTp = openTokenPocket({ checkOnly: true });
    const isOpenOK = openOkxWallet({ checkOnly: true });
    const isOpenMM = openMetaMaskWallet({ checkOnly: true });
    const isOpenBinance = openBinanceWallet({ checkOnly: true });
    setIsOpenWalletApp(
      isMobileBrowser && (isOpenTp || isOpenOK || isOpenMM || isOpenBinance),
    );
  }, [isMobileBrowser]);

  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const closeConnectModal = () => {
    setConnectModalOpen(false);
  };

  const openConnectModal = () => {
    if (isInWalletInAppBrowser()) {
      void connectInAppBrowserWallet().catch((error) => {
        console.error("[wallet] In-app auto-connect failed:", error);
      });
      return;
    }

    // Open the wallet selector only after TokenPocket wallet integration is completed
    if (isOpenWalletApp) {
      setConnectModalOpen(true);
      return;
    }

    rainbowkitOpenConnectModal?.();
  };

  const handleWalletSelect = (walletId: Parameters<typeof launchWalletApp>[0]) => {
    closeConnectModal();
    if (walletId === "others") {
      rainbowkitOpenConnectModal?.();
      return;
    }
    launchWalletApp(walletId);
  };

  return (
    <ConnectModalContext.Provider
      value={{
        connectModalOpen: (rainbowkitConnectModalOpen ?? false) || connectModalOpen,
        openConnectModal,
      }}
    >
      {children}
      <WalletSelectorModal
        open={Boolean(connectModalOpen && isOpenWalletApp)}
        onClose={closeConnectModal}
        onSelect={handleWalletSelect}
      />
    </ConnectModalContext.Provider>
  );
}

export function useConnectModal() {
  return useContext(ConnectModalContext);
}
