import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useConnectModal as useRainbowkitConnectModal } from "@rainbow-me/rainbowkit";
import { useDevice } from "@/hooks/common/use-device";
import { isInMobileBrowser, openOkxWallet, openTokenPocket } from "../utils";

export interface ConnectModal {

}

export const ConnectModalContext = createContext<ConnectModal>({});

export function ConnectModalProvider({ children }: { children: React.ReactNode }) {
  const {
    connectModalOpen: rainbowkitConnectModalOpen,
    openConnectModal: rainbowkitOpenConnectModal
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

  const openConnectModal = () => {
    if (isOpenWalletApp) {
      setConnectModalOpen(true);
      return;
    }
    rainbowkitOpenConnectModal?.();
  };

  return (
    <ConnectModalContext.Provider
      value={{
        connectModalOpen: rainbowkitConnectModalOpen || connectModalOpen,
        openConnectModal,
      }}
    >
      {children}
    </ConnectModalContext.Provider>
  );
}

export function useConnectModal() {
  return useContext(ConnectModalContext);
}
