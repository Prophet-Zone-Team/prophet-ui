import { PortfolioViewModel } from "@/lib/portfolio/portfolio-metrics";
import { PortfolioLoadStatus } from "@/lib/portfolio/types";
import { TradingUserSession } from "@/types/market";
import { createContext, useContext } from "react";

export interface PortfolioContextType {
  session: TradingUserSession | undefined;
  portfolio: PortfolioViewModel | undefined;
  status: PortfolioLoadStatus;
  onConnectWallet: () => void;
  reload: () => void;
  removeOpenOrder: (orderId: string) => void;
  removeOpenOrders: (orderIds: string[]) => void;
  removeOpenOrdersByMarket: (marketId: string) => void;
  coreStatus: PortfolioLoadStatus;
}

const PortfolioContext = createContext<PortfolioContextType>({
  session: undefined,
  portfolio: undefined,
  status: "idle",
  onConnectWallet: () => { },
  reload: () => { },
  removeOpenOrder: () => { },
  removeOpenOrders: () => { },
  removeOpenOrdersByMarket: () => { },
  coreStatus: "idle",
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
