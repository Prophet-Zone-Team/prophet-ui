"use client";

import type { WalletName } from "@solana/wallet-adapter-base";
import {
  BaseWalletAdapter,
  WalletConnectionError,
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletReadyState,
  type WalletAdapter,
} from "@solana/wallet-adapter-base";
import type { Transaction, TransactionVersion, VersionedTransaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { InAppBrowserWalletKind } from "@/context/rainbowkit/utils";

type InjectedSolanaProvider = {
  connect?: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect?: () => Promise<void>;
  publicKey?: PublicKey | null;
  signTransaction?: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ) => Promise<T[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
};

export const OKX_SOLANA_WALLET_NAME = "OKX Wallet" as WalletName<"OKX Wallet">;
export const BINANCE_SOLANA_WALLET_NAME = "Binance Wallet" as WalletName<"Binance Wallet">;
export const METAMASK_SOLANA_WALLET_NAME = "MetaMask" as WalletName<"MetaMask">;

const IN_APP_SOLANA_WALLET_NAMES: Record<InAppBrowserWalletKind, WalletName[]> = {
  tokenpocket: ["Phantom" as WalletName],
  okx: [OKX_SOLANA_WALLET_NAME],
  metamask: [METAMASK_SOLANA_WALLET_NAME],
  binance: [BINANCE_SOLANA_WALLET_NAME],
};

export function getInAppSolanaWalletName(kind: InAppBrowserWalletKind): WalletName {
  return IN_APP_SOLANA_WALLET_NAMES[kind][0];
}

export function getInAppSolanaWalletNames(kind: InAppBrowserWalletKind): WalletName[] {
  return IN_APP_SOLANA_WALLET_NAMES[kind];
}

class InjectedSolanaWalletAdapter extends BaseWalletAdapter {
  name: WalletName;
  url: string;
  icon: string;
  publicKey: PublicKey | null = null;
  connecting = false;
  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set([
    "legacy",
    0,
  ]);

  private readonly getProvider: () => InjectedSolanaProvider | undefined;

  constructor(params: {
    name: WalletName;
    url: string;
    icon: string;
    getProvider: () => InjectedSolanaProvider | undefined;
  }) {
    super();
    this.name = params.name;
    this.url = params.url;
    this.icon = params.icon;
    this.getProvider = params.getProvider;
  }

  get readyState() {
    return this.getProvider() ? WalletReadyState.Installed : WalletReadyState.NotDetected;
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) {
      return;
    }

    const provider = this.getProvider();

    if (!provider?.connect) {
      throw new WalletNotReadyError();
    }

    try {
      this.connecting = true;

      const result = await provider.connect();
      const publicKey = result.publicKey ?? provider.publicKey ?? null;

      if (!publicKey) {
        throw new WalletConnectionError();
      }

      this.publicKey = publicKey;
      this.emit("connect", publicKey);
    } catch (error) {
      this.emit("error", error as WalletError);
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const provider = this.getProvider();

    if (provider?.disconnect) {
      await provider.disconnect().catch(() => undefined);
    }

    if (this.publicKey) {
      this.publicKey = null;
      this.emit("disconnect");
    }
  }

  async sendTransaction(): Promise<string> {
    throw new WalletNotConnectedError();
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    const provider = this.getProvider();

    if (!provider?.signTransaction || !this.publicKey) {
      throw new WalletNotConnectedError();
    }

    try {
      return await provider.signTransaction(transaction);
    } catch (error) {
      this.emit("error", error as WalletError);
      throw error;
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    const provider = this.getProvider();

    if (!provider?.signAllTransactions || !this.publicKey) {
      throw new WalletNotConnectedError();
    }

    try {
      return await provider.signAllTransactions(transactions);
    } catch (error) {
      this.emit("error", error as WalletError);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const provider = this.getProvider();

    if (!provider?.signMessage || !this.publicKey) {
      throw new WalletNotConnectedError();
    }

    try {
      const result = await provider.signMessage(message);
      return result.signature;
    } catch (error) {
      this.emit("error", error as WalletError);
      throw error;
    }
  }
}

function getOkxSolanaProvider(): InjectedSolanaProvider | undefined {
  return (window.okxwallet as any)?.solana as InjectedSolanaProvider | undefined;
}

function getBinanceSolanaProvider(): InjectedSolanaProvider | undefined {
  return window.binancew3w?.solana as InjectedSolanaProvider | undefined;
}

function getMetaMaskSolanaProvider(): InjectedSolanaProvider | undefined {
  const candidate = window.solana;

  if (!candidate) {
    return undefined;
  }

  const provider = candidate as InjectedSolanaProvider & {
    isMetaMask?: boolean;
    isPhantom?: boolean;
  };

  if (provider.isMetaMask && !provider.isPhantom) {
    return provider;
  }

  return undefined;
}

export function buildInAppSolanaWalletAdapters(): WalletAdapter[] {
  return [
    new InjectedSolanaWalletAdapter({
      name: OKX_SOLANA_WALLET_NAME,
      url: "https://okx.com",
      icon: "https://static.okx.com/cdn/wallet/logo/okx_wallet_logo.png",
      getProvider: getOkxSolanaProvider,
    }),
    new InjectedSolanaWalletAdapter({
      name: BINANCE_SOLANA_WALLET_NAME,
      url: "https://www.binance.com/en/binancewallet",
      icon: "https://public.bnbstatic.com/static/wallet/images/binance-wallet-logo.png",
      getProvider: getBinanceSolanaProvider,
    }),
    new InjectedSolanaWalletAdapter({
      name: METAMASK_SOLANA_WALLET_NAME,
      url: "https://metamask.io",
      icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
      getProvider: getMetaMaskSolanaProvider,
    }),
  ];
}

export function resolveInAppSolanaWallet(
  wallets: WalletAdapter[],
  kind: InAppBrowserWalletKind,
): WalletAdapter | undefined {
  const targetNames = getInAppSolanaWalletNames(kind);

  return wallets.find(
    (wallet) =>
      targetNames.includes(wallet.name) &&
      (wallet.readyState === WalletReadyState.Installed ||
        wallet.readyState === WalletReadyState.Loadable),
  ) ?? wallets.find(
    (wallet) =>
      wallet.readyState === WalletReadyState.Installed ||
      wallet.readyState === WalletReadyState.Loadable
  );
}
