"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useConnectModal as useRainbowkitConnectModal } from "@rainbow-me/rainbowkit";

import { useDevice } from "@/hooks/common/use-device";

import { isInMobileBrowser, openOkxWallet, openTokenPocket } from "../utils";
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

  const isOpenWalletApp = useMemo(() => {
    const isOpenTp = openTokenPocket({ checkOnly: true });
    const isOpenOK = openOkxWallet({ checkOnly: true });
    return isMobileBrowser && (isOpenTp || isOpenOK);
  }, [isMobileBrowser]);

  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const closeConnectModal = () => {
    setConnectModalOpen(false);
  };

  const openConnectModal = () => {
    if (isOpenWalletApp) {
      setConnectModalOpen(true);
      return;
    }

    rainbowkitOpenConnectModal?.();
  };

  const handleWalletSelect = (walletId: Parameters<typeof launchWalletApp>[0]) => {
    closeConnectModal();
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
