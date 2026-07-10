import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";

export type CopyWalletPositionStatus = "active" | "ended";

export interface CopyWalletPositionDisplay {
  id: string;
  status: CopyWalletPositionStatus;
  title: string;
  outcome: string;
  avgPrice: number;
  currentPrice: number;
  shares: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  lastTradeAt: string;
  icon: PortfolioMarketIcon;
  tradeHref?: string;
}
