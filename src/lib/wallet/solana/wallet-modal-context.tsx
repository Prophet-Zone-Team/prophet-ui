"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SolanaWalletModalContextValue {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const SolanaWalletModalContext = createContext<SolanaWalletModalContextValue>({
  visible: false,
  setVisible: () => undefined,
});

export function SolanaWalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const value = useMemo(
    () => ({
      visible,
      setVisible,
    }),
    [visible],
  );

  return (
    <SolanaWalletModalContext.Provider value={value}>
      {children}
    </SolanaWalletModalContext.Provider>
  );
}

export function useSolanaWalletModal() {
  return useContext(SolanaWalletModalContext);
}
