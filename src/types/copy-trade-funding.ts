import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";

// Copy Trade funding (deposit / withdrawal) API shapes.
// Field casing mirrors the copy-trade Go backend exactly:
// deposit/supported-assets/withdrawal readiness use snake_case;
// the Withdrawal lifecycle row uses PascalCase.

export interface CopyTradePolymarketDepositPreparePayload {
  funderAddress: string;
  recipient: string;
  transfer: DepositWalletBatchSignablePayload;
}

export interface CopyDepositAddress {
  user_id: number;
  copy_deposit_wallet_address: string;
  evm_deposit_address: string;
  svm_deposit_address: string;
  tron_deposit_address: string;
  btc_deposit_address: string;
}

export interface CopyDepositTransaction {
  from_chain_id: string;
  from_token_address: string;
  to_chain_id: string;
  to_token_address: string;
  amount_pusd: number;
  status: string;
  tx_hash: string;
  created_time_ms: number;
  credited: boolean;
  credit_eligible: boolean;
  credit_skipped_reason: string;
}

export interface CopyDepositStatusResult {
  evm_deposit_address: string;
  transactions: CopyDepositTransaction[];
  credited_pusd: number;
}

export type CopyTransferDepositStatus =
  | "submitted"
  | "waiting_confirmations"
  | "tx_not_found_retry"
  | "rpc_retry"
  | "credited"
  | "invalid"
  | "ambiguous";

export interface CopyTransferDeposit {
  id: number;
  tx_hash: string;
  submitter_user_id: number;
  submitter_wallet_address: string;
  matched_user_id: number;
  deposit_wallet_address: string;
  amount_base_unit: string;
  amount_pusd: number;
  status: CopyTransferDepositStatus | string;
  tx_block_number?: number;
  latest_block_number?: number;
  confirmations?: number;
  log_index?: number;
  ledger_ref_id?: string;
  attempts?: number;
  next_attempt_at?: string | null;
  last_alert_at?: string | null;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface CopyBridgeSupportedAsset {
  chainId: string;
  chainName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  decimals: number;
  minCheckoutUsd: number;
}

export interface CopyWithdrawalAssetInfo {
  asset: string;
  label: string;
  token_address: string;
  enabled: boolean;
  status: string;
  reason: string;
  checked_at: string;
  route?: string;
  chain_id?: string;
  min_amount_pusd?: number;
  icon?: string;
}

export interface CopyWithdrawalReadiness {
  user_id: number;
  available_pusd: number;
  reserved_pusd: number;
  pending_platform_fees_pusd: number;
  claim_basis_pusd: number;
  has_recent_trade: boolean;
  pending_settlements: number;
  pending_cashflow_reconciliations: number;
  error_cashflow_reconciliations: number;
  pending_redeem_attempts: number;
  pending_redeemable_positions: number;
  pending_position_outcomes: number;
  error_position_outcomes: number;
  position_outcome_ready: boolean;
  cashflow_ready: boolean;
}

export interface CopyWithdrawal {
  ID: number;
  UserID: number;
  ClientRequestID: string;
  RecipientAddress: string;
  Asset: string;
  AmountPUSD: number;
  Status: string;
  RelayerTxID: string;
  TxHash: string;
  Error: string;
  WithdrawalRoute: string;
  BridgeStatusAddress: string;
  BridgeStatus: string;
  BridgeDestinationChainID: string;
  BridgeDestinationTokenAddress: string;
  RelayerTxHash: string;
  BridgeError: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateCopyWithdrawalRequest {
  client_request_id: string;
  amount_pusd: number;
  recipient_address?: string;
  asset?: string;
}

export type CopyWithdrawalAsset = "pusd" | "usdce" | "usdc";
