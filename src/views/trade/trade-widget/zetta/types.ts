import type { MatchOutcomeSide } from "@/types/market";

export type ZettaWalletSideStats = {
  smart_wallet_count: number;
  smart_amount: number;
  whale_wallet_count: number;
  whale_amount: number;
};

export type ZettaSmartWalletOption = {
  market_question: string;
  yes: ZettaWalletSideStats;
  no: ZettaWalletSideStats;
};

export type ZettaSmartWalletsResponse = {
  event: {
    event_id: string;
    slug: string;
    title: string;
    category: string;
    active: boolean;
    closed: boolean;
    start_time: string;
    end_time: string;
    updated_at: string;
  };
  options: ZettaSmartWalletOption[];
};

export type ZettaOutcomeWalletCounts = {
  side: MatchOutcomeSide;
  yesSmartWalletCount: number;
  noSmartWalletCount: number;
  yesWhaleWalletCount: number;
  noWhaleWalletCount: number;
};
