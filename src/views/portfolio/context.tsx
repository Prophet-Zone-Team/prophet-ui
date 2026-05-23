import { PortfolioViewModel } from "@/lib/portfolio/portfolio-metrics";
import { PortfolioLoadStatus } from "@/lib/portfolio/types";
import { TradingUserSession } from "@/types/market";
import { createContext, useContext } from "react";

export interface PortfolioContextType {
  session: TradingUserSession | undefined;
  portfolio: PortfolioViewModel | undefined;
  status: PortfolioLoadStatus;
  onConnectWallet: () => void;
}

const PortfolioContext = createContext<PortfolioContextType>({
  session: undefined,
  portfolio: undefined,
  status: "idle",
  onConnectWallet: () => { },
});

export function PortfolioProvider({ children, value }: { children: React.ReactNode, value: PortfolioContextType }) {
  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  return useContext(PortfolioContext);
}
