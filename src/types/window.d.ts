interface TokenPocketEthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface TokenPocketWindow {
  ethereum?: TokenPocketEthereumProvider;
}

interface OkxWalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface OkxWalletWindow {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface BinanceW3wEthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  isBinance?: boolean;
}

interface BinanceW3wWindow {
  ethereum?: BinanceW3wEthereumProvider;
}

declare global {
  interface Window {
    tokenpocket?: TokenPocketWindow;
    okxwallet?: OkxWalletWindow;
    binancew3w?: BinanceW3wWindow;
  }
}

export {};
