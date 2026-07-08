import type { CopyTargetDisplayStats } from "@/lib/copy-trade/target-stats";
import type { CopyTarget } from "@/types/copy-trade-api";

const BASE_TARGET: CopyTarget = {
  UserID: 9,
  Wallet: "0x742d35cc6634c0532925a3b844bc9e7595f0bbe0",
  Enabled: true,
  DryRun: false,
  SizeMode: "ratio",
  FixedUSD: 0,
  Ratio: 0.25,
  MaxUSDPerTrade: 10,
  MaxUSDPerMarket: 30,
  MaxUSDPerHour: 200,
  MaxUSDTotal: 500,
  UsedUSDTotal: 120,
  MinPrice: 0.2,
  MaxPrice: 0.95,
  MaxSlippage: 0.03,
  OrderType: "FAK",
  TakerOnly: true,
  BuyTakerOnly: true,
  SellTakerOnly: true,
  BuyEnabled: true,
  SellEnabled: true,
  AllowedConditions: null,
  BlockedConditions: null
};

export interface CopyTradeTotalCapPreviewScenario {
  id: string;
  label: string;
  description: string;
  target: CopyTarget;
  stats: CopyTargetDisplayStats;
}

function withTarget(
  id: string,
  label: string,
  description: string,
  overrides: Partial<CopyTarget>,
  stats: CopyTargetDisplayStats
): CopyTradeTotalCapPreviewScenario {
  return {
    id,
    label,
    description,
    target: {
      ...BASE_TARGET,
      Wallet: `0x${id.padStart(40, "0")}`,
      ...overrides
    },
    stats
  };
}

const SAMPLE_STATS: CopyTargetDisplayStats = {
  totalBuy: 842.5,
  totalSell: 310.2,
  buyCount: 12,
  sellCount: 4,
  pnl: 48.75,
  lastTradeAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
};

export const COPY_TRADE_TOTAL_CAP_PREVIEW_SCENARIOS: CopyTradeTotalCapPreviewScenario[] =
  [
    withTarget(
      "running",
      "Running (under cap)",
      "Enabled copy target with headroom below total cap.",
      { Enabled: true, MaxUSDTotal: 500, UsedUSDTotal: 120 },
      SAMPLE_STATS
    ),
    withTarget(
      "paused",
      "Paused",
      "Copy target is paused; no cap warning.",
      { Enabled: false, MaxUSDTotal: 500, UsedUSDTotal: 120 },
      SAMPLE_STATS
    ),
    withTarget(
      "cap-enabled",
      "Cap reached (enabled)",
      "Enabled but UsedUSDTotal >= MaxUSDTotal; shows amber warning.",
      { Enabled: true, MaxUSDTotal: 500, UsedUSDTotal: 500 },
      {
        ...SAMPLE_STATS,
        totalBuy: 1250,
        buyCount: 28
      }
    ),
    withTarget(
      "cap-exceeded",
      "Cap exceeded (enabled)",
      "UsedUSDTotal above MaxUSDTotal; same warning treatment.",
      { Enabled: true, MaxUSDTotal: 500, UsedUSDTotal: 612.4 },
      {
        ...SAMPLE_STATS,
        totalBuy: 1380,
        pnl: -22.1
      }
    ),
    withTarget(
      "cap-paused",
      "Cap reached (paused)",
      "Paused with cap reached; badge still visible for context.",
      { Enabled: false, MaxUSDTotal: 500, UsedUSDTotal: 500 },
      SAMPLE_STATS
    ),
    withTarget(
      "no-cap",
      "No total cap",
      "MaxUSDTotal = 0 means unlimited; no cap UI.",
      { Enabled: true, MaxUSDTotal: 0, UsedUSDTotal: 2500 },
      SAMPLE_STATS
    )
  ];

export const COPY_TRADE_TOTAL_CAP_MODAL_TARGET =
  COPY_TRADE_TOTAL_CAP_PREVIEW_SCENARIOS.find(
    (scenario) => scenario.id === "cap-enabled"
  )!.target;
