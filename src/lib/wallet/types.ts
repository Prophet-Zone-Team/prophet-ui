export type ChainType = "evm" | "solana" | "tron";

export type WalletAccountSource = "wagmi" | "privy";

export interface UnifiedWalletAccount {
  address?: string;
  chainId?: number;
  connected: boolean;
  source?: WalletAccountSource;
}

export interface WalletTransferParams {
  walletAddress: string;
  chainId: number;
  /** Token contract address, or the native-token sentinel address. */
  tokenAddress: string;
  toAddress: string;
  /** Human-readable decimal amount (e.g. "12.5"). */
  amount: string;
  tokenDecimals: number;
}

export interface WalletTransferResult {
  txHash: string;
}

export interface EnsureChainOptions {
  onChecking?: () => void;
  onSwitching?: () => void;
  /** Overrides the error shown when the user rejects the network switch. */
  rejectionMessage?: string;
  /** Overrides the error shown when the wallet never lands on the target chain. */
  timeoutMessage?: string;
}

/**
 * Chain-type-agnostic wallet operations. Each supported chain family (EVM
 * today, Solana/Tron later) provides one implementation; callers route
 * through getWalletAdapter(chainType) instead of importing chain-specific
 * modules.
 */
export interface WalletAdapter {
  readonly chainType: ChainType;
  getActiveAccount(): UnifiedWalletAccount;
  signMessage(walletAddress: string, message: string): Promise<`0x${string}`>;
  ensureChain(
    walletAddress: string,
    chainId: number,
    options?: EnsureChainOptions,
  ): Promise<void>;
  transferToken(params: WalletTransferParams): Promise<WalletTransferResult>;
  disconnect(): Promise<void>;
}

export class UnsupportedChainTypeError extends Error {
  readonly chainType: string;

  constructor(chainType: string) {
    super(`Wallet operations for chain type "${chainType}" are not supported yet.`);
    this.name = "UnsupportedChainTypeError";
    this.chainType = chainType;
  }
}
