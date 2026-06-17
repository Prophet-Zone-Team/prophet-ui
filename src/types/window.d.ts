interface TokenPocketEthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface TokenPocketWindow {
  ethereum?: TokenPocketEthereumProvider;
}

interface OkxWalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  connect?: () => Promise<{ publicKey: { toBase58: () => string } }>;
  publicKey?: { toBase58: () => string } | null;
  signTransaction?: (transaction: unknown) => Promise<unknown>;
  signAllTransactions?: (transactions: unknown[]) => Promise<unknown[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

interface OkxWalletWindow {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  solana?: OkxWalletProvider;
}

interface BinanceW3wEthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  isBinance?: boolean;
}

interface BinanceW3wSolanaProvider {
  connect?: () => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect?: () => Promise<void>;
  publicKey?: { toBase58: () => string } | null;
  signTransaction?: (transaction: unknown) => Promise<unknown>;
  signAllTransactions?: (transactions: unknown[]) => Promise<unknown[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

interface BinanceW3wWindow {
  ethereum?: BinanceW3wEthereumProvider;
  tron?: unknown;
  solana?: BinanceW3wSolanaProvider;
}

interface MetaMaskSolanaProvider {
  connect?: () => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect?: () => Promise<void>;
  publicKey?: { toBase58: () => string } | null;
  signTransaction?: (transaction: unknown) => Promise<unknown>;
  signAllTransactions?: (transactions: unknown[]) => Promise<unknown[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  isMetaMask?: boolean;
  isPhantom?: boolean;
}

declare global {
  interface Window {
    tokenpocket?: TokenPocketWindow;
    okxwallet?: OkxWalletWindow;
    binancew3w?: BinanceW3wWindow;
    solana?: MetaMaskSolanaProvider;
  }
}

export {};
