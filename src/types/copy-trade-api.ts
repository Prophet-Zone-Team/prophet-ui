// Aligned with Copy Trade Go backend JSON fields.
// Go structs mostly serialize with PascalCase (UserID, Available);
// some endpoints use snake_case json tags.

export interface CopyTradeUser {
  ID: number;
  ExternalID: string;
  Email: string;
  WebWalletAddress: string;
  Status: string;
}

export interface CopyWallet {
  UserID: number;
  CopyOwnerAddress: string;
  CopyDepositWalletAddress: string;
  BridgeEVMDepositAddress: string;
  SignatureType: number;
  WalletStatus: string;
  WalletCreateTransactionID: string;
  WalletCreateTransactionHash: string;
  WalletCreateState: string;
  WalletCreateError: string;
  CollateralApproved: boolean;
  CollateralApprovedAt?: string;
  CollateralApprovalLastAttemptAt?: string;
  CollateralApprovalLastError?: string;
  AutoRedeemApproved: boolean;
  AutoRedeemApprovedAt?: string;
  AutoRedeemLastAttemptAt?: string;
  AutoRedeemLastError?: string;
}

export interface UserWithCopyWallet extends CopyTradeUser {
  CopyWallet?: CopyWallet | null;
}

export interface CopyTradeStoredSession {
  walletAddress: string;
  user: CopyTradeUser;
  copyWallet?: CopyWallet | null;
  expiresAt?: number;
}

export interface CopyTradePlatformMetrics {
  verified_pnl_usd: number;
  verified_volume_usd: number;
  pnl_baseline_usd: number;
  volume_baseline_usd: number;
  display_pnl_usd: number;
  display_volume_usd: number;
  updated_at: string;
}

export interface CopyTradeBalance {
  UserID: number;
  Currency: string;
  Available: number;
  Reserved: number;
  TotalOpenFeeUSD: number;
  PendingOpenFeeUSD: number;
  CollectedOpenFeeUSD: number;
}

export interface CopyProfile {
  UserID: number;
  TargetWallet: string;
  Enabled: boolean;
  DryRun: boolean;
  SizeMode: string;
  FixedUSD: number;
  Ratio: number;
  InvestmentUSD: number;
  MaxUSDPerTrade: number;
  MaxUSDPerMarket: number;
  MaxUSDPerHour: number;
  MaxUSDTotal: number;
  MinPrice: number;
  MaxPrice: number;
  MaxSlippage: number;
  OrderType: string;
  TakerOnly: boolean;
  BuyTakerOnly: boolean;
  SellTakerOnly: boolean;
  BuyEnabled: boolean;
  SellEnabled: boolean;
  AllowedConditions: string[] | null;
  BlockedConditions: string[] | null;
}

export interface CopyTargetEmbeddedPnL {
  realized_pnl: number;
}

export interface CopyTarget {
  UserID: number;
  Wallet: string;
  Enabled: boolean;
  DryRun: boolean;
  SizeMode: string;
  FixedUSD: number;
  Ratio: number;
  MaxUSDPerTrade: number;
  MaxUSDPerMarket: number;
  MaxUSDPerHour: number;
  MaxUSDTotal: number;
  UsedUSDTotal: number;
  MinPrice: number;
  MaxPrice: number;
  MaxSlippage: number;
  OrderType: string;
  TakerOnly: boolean;
  BuyTakerOnly: boolean;
  SellTakerOnly: boolean;
  BuyEnabled: boolean;
  SellEnabled: boolean;
  AllowedConditions: string[] | null;
  BlockedConditions: string[] | null;
  BuyVolumePUSD?: number;
  SellVolumePUSD?: number;
  BuyTradeCount?: number;
  SellTradeCount?: number;
  LastTradeAt?: string;
  PnL?: CopyTargetEmbeddedPnL | null;
}

export interface TraderCatalogEntry {
  ID: number;
  Wallet: string;
  DisplayName: string;
  Bio: string;
  Tag: "smart" | "whale" | string;
  WinRate30d: number;
  PnL30d: number;
  PnL24h: number;
  FifaPnL24h: number;
  PnL7D?: number;
  FifaPnL7d?: number;
  FifaBuyCount?: number;
  Volume30d: number;
  Trades30d: number;
  TotalWinRate?: number;
  TotalPnL?: number;
  TotalVolume?: number;
  TotalTrades?: number;
  RiskLevel: string;
  Enabled: boolean;
  SortWeight: number;
  UpdatedAt: string;
  Source: "catalog" | "user_imported";
}

export interface CopyTradeUserOrder {
  ID: number;
  UserID: number;
  OrderID: string;
  TargetEventKey: string;
  TokenID: string;
  ConditionID: string;
  Side: string;
  Price: number;
  Size: number;
  NotionalUSD: number;
  OrderPrincipalUSD: number;
  FeeUSD: number;
  OpenFeeUSD: number;
  BuilderTakerFeeUSD: number;
  PolymarketFeeUSD: number;
  Status: string;
  Error: string;
  CreatedAt: string;
}

export interface CopyTargetPnL {
  target_wallet: string;
  cash_pnl: number;
  realized_pnl: number;
  unrealized_pnl: number;
  initial_value: number;
  current_value: number;
  positions: number;
}

export interface CopyPositionPnL {
  target_wallet: string;
  token_id: string;
  condition_id: string;
  title: string;
  slug: string;
  icon: string;
  outcome: string;
  size: number;
  avg_price: number;
  cur_price: number;
  initial_value: number;
  current_value: number;
  cash_pnl: number;
  realized_pnl: number;
  percent_pnl: number;
  redeemable: boolean;
  last_trade_at: string;
  spent_usd: number;
  buy_spent_usd: number;
  sell_proceeds_usd: number;
  claim_proceeds_usd: number;
  recovered_usd: number;
  fee_usd: number;
  settlement_status: "open" | "lost" | "won_redeemable" | string;
  end_date: string;
}

export interface CopyPnLSummary {
  address: string;
  total_cash_pnl: number;
  total_realized_pnl: number;
  total_unrealized_pnl: number;
  total_initial_value: number;
  total_current_value: number;
  open_positions: number;
  biggest_win_amount: number;
  targets: CopyTargetPnL[];
  positions: CopyPositionPnL[];
  history: CopyPositionPnL[];
}

export interface CopyPnLTargetPage {
  target_wallet: string;
  items: CopyPositionPnL[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export type CopyPnLRange = "24H" | "7D" | "30D" | "1Year" | "Total";

export interface CopyPnLPoint {
  t: number;
  p: number;
}

export type CopyPnLPointsResponse = Record<CopyPnLRange, CopyPnLPoint[]>;

export interface CopyTradeManualSellResult {
  order_id: string;
  token_id: string;
  condition_id: string;
  shares: number;
  price: number;
  status: string;
  transaction_hashes: string[];
}

export interface CopyTradeSellableBalance {
  token_id: string;
  shares: number;
  min_shares: number;
  cashflow_pending: number;
}

export interface CreateCopyTradeUserRequest {
  external_id: string;
  email: string;
  web_wallet_address: string;
}

export interface CopyProfileUpdateRequest {
  enabled?: boolean;
  dry_run?: boolean;
  size_mode?: string;
  fixed_usd?: number;
  ratio?: number;
  investment_usd?: number;
  min_price?: number;
  max_price?: number;
  max_slippage?: number;
  order_type?: string;
  taker_only?: boolean;
  buy_taker_only?: boolean;
  sell_taker_only?: boolean;
  buy_enabled?: boolean;
  sell_enabled?: boolean;
  max_usd_per_trade?: number;
  max_usd_per_market?: number;
  max_usd_per_hour?: number;
  max_usd_total?: number;
}

export interface CopyTargetUpdateItem {
  wallet: string;
  enabled?: boolean;
  dry_run?: boolean;
  size_mode?: string;
  fixed_usd?: number;
  ratio?: number;
  min_price?: number;
  max_price?: number;
  max_slippage?: number;
  order_type?: string;
  taker_only?: boolean;
  buy_taker_only?: boolean;
  sell_taker_only?: boolean;
  buy_enabled?: boolean;
  sell_enabled?: boolean;
  max_usd_per_trade?: number;
  max_usd_per_market?: number;
  max_usd_per_hour?: number;
  max_usd_total?: number;
  allowed_conditions?: string[];
  blocked_conditions?: string[];
}

export interface CopyTargetsUpdateRequest {
  items: CopyTargetUpdateItem[];
}

export interface CopySellRequest {
  token_id: string;
  condition_id: string;
  shares?: number;
  sell_all?: boolean;
  max_slippage?: number;
  min_price?: number;
}

export interface CopyTradersListResponse {
  items: TraderCatalogEntry[];
}

export interface ImportCopyTraderRequest {
  wallet: string;
}

export interface ImportCopyTraderResponse {
  ok: boolean;
}

export interface CopyTraderTracksListResponse {
  items: TraderCatalogEntry[];
}

export interface TrackCopyTraderRequest {
  wallet: string;
}

export interface TrackCopyTraderResponse {
  ok: boolean;
}

export interface CopyTraderTrackLatestItem {
  wallet: string;
  display_name: string;
  source: "catalog" | "user_imported" | string;
  transaction_hash: string;
  condition_id: string;
  token_id: string;
  side: "BUY" | "SELL" | string;
  price: number;
  size: number;
  notional_usd: number;
  outcome: string;
  title: string;
  slug: string;
  event_slug: string;
  event_end: string;
  timestamp: number;
}

export interface CopyTraderTrackLatestError {
  wallet: string;
  error: string;
}

export interface CopyTraderTracksLatestResponse {
  items: CopyTraderTrackLatestItem[];
  errors: CopyTraderTrackLatestError[];
}

export interface CopyTargetsUpdateResponse {
  ok: boolean;
}
