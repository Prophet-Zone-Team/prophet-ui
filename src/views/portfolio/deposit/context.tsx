import { FundingAsset } from "@/config/funding";
import { createContext, useContext } from "react";

export interface DepositContextType {
  supportedAssets: FundingAsset[];
}

const DepositContext = createContext<DepositContextType>({
  supportedAssets: [],
});

export function DepositProvider({ children, value }: { children: React.ReactNode, value: DepositContextType }) {
  return (
    <DepositContext.Provider value={value}>
      {children}
    </DepositContext.Provider>
  );
}

export function useDepositContext() {
  return useContext(DepositContext);
}
