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

declare global {
  interface Window {
    tokenpocket?: TokenPocketWindow;
    okxwallet?: OkxWalletWindow;
  }
}

export {};
