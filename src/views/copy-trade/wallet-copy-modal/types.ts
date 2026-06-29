export const COPY_TRADE_RATIO_PRESETS = [10, 25, 50, 100] as const;

export const COPY_TRADE_ORDER_TYPES = [
  { value: "FAK", label: "FAK (Fill And Kill)" },
  { value: "FOK", label: "FOK (Fill Or Kill)" }
] as const;

export type CopyTradeOrderType =
  (typeof COPY_TRADE_ORDER_TYPES)[number]["value"];

export interface WalletCopyFormValues {
  ratio: number;
  buyEnabled: boolean;
  sellEnabled: boolean;
  buyTakerOnly: boolean;
  sellTakerOnly: boolean;
  maxUsdPerTrade: string;
  maxUsdPerMarket: string;
  maxUsdPerHour: string;
  maxUsdTotal: string;
  minPrice: string;
  maxPrice: string;
  maxSlippage: string;
  orderType: CopyTradeOrderType;
}

export const DEFAULT_WALLET_COPY_FORM: WalletCopyFormValues = {
  ratio: 10,
  buyEnabled: true,
  sellEnabled: true,
  buyTakerOnly: true,
  sellTakerOnly: false,
  maxUsdPerTrade: "50",
  maxUsdPerMarket: "200",
  maxUsdPerHour: "500",
  maxUsdTotal: "2000",
  minPrice: "0.02",
  maxPrice: "0.97",
  maxSlippage: "0.03",
  orderType: "FAK"
};

export interface WalletCopyTraderStats {
  pnlPercent: string | null;
  pnlUsd: string | null;
  winRate: string | null;
  lastTrade: string | null;
}
