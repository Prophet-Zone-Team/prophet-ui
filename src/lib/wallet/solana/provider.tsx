"use client";

import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { isInWalletInAppBrowser } from "@/context/rainbowkit/utils";
import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { generateRpcSignature } from "@/config/funding/signature";
import { connectInAppBrowserSolanaWallet } from "@/lib/wallet/solana/connect-in-app-browser";
import { buildInAppSolanaWalletAdapters } from "@/lib/wallet/solana/in-app-adapters";
import { setFundingWalletInstance } from "@/lib/wallet/solana/funding-wallet-instance";
import { SolanaWalletModalProvider, useSolanaWalletModal } from "@/lib/wallet/solana/wallet-modal-context";
import { SolanaWalletSelectorModal } from "@/lib/wallet/solana/wallet-selector-modal";
import SolanaFundingWallet from "@/lib/wallet/solana/wallet";
import { useFundingWalletStore } from "@/store/use-funding-wallet-store";

function buildSolanaAdapters() {
  return [
    ...buildInAppSolanaWalletAdapters(),
    new SolflareWalletAdapter(),
    new PhantomWalletAdapter(),
  ];
}

function SolanaFundingBridge() {
  const walletAdapter = useWallet();
  const { publicKey, disconnect, connect, wallet, connecting, wallets, select } = walletAdapter;
  const { setVisible } = useSolanaWalletModal();
  const setSlice = useFundingWalletStore((state) => state.setSlice);
  const registerConnectHandler = useFundingWalletStore((state) => state.registerConnectHandler);
  const registerDisconnectHandler = useFundingWalletStore((state) => state.registerDisconnectHandler);

  const address = publicKey?.toBase58();
  const signTransactionRef = useRef(walletAdapter.signTransaction);

  useEffect(() => {
    signTransactionRef.current = walletAdapter.signTransaction;
  });

  const applyConnectedSolanaAdapter = useCallback(
    (adapter: WalletAdapter, connectedAddress: string) => {
      select(adapter.name);

      if (
        !adapter.publicKey ||
        !("signTransaction" in adapter) ||
        typeof adapter.signTransaction !== "function"
      ) {
        throw new Error("Wallet connection failed.");
      }

      setFundingWalletInstance(
        new SolanaFundingWallet({
          publicKey: adapter.publicKey,
          signTransaction: adapter.signTransaction.bind(adapter),
        }),
      );
      setSlice("solana", {
        address: connectedAddress,
        connected: true,
        connecting: false,
        walletName: adapter.name,
      });
    },
    [select, setSlice],
  );

  useEffect(() => {
    const signTransaction = signTransactionRef.current;

    if (address && signTransaction && publicKey) {
      setFundingWalletInstance(
        new SolanaFundingWallet({
          publicKey,
          signTransaction: signTransaction.bind(walletAdapter),
        }),
      );
      setSlice("solana", {
        address,
        connected: true,
        connecting: false,
        walletName: wallet?.adapter.name,
      });
      return;
    }

    const slice = useFundingWalletStore.getState().solana;
    if (slice.connected && slice.address) {
      return;
    }

    setFundingWalletInstance(null);
    setSlice("solana", {
      address: undefined,
      connected: false,
      connecting,
      walletName: undefined,
    });
  }, [address, connecting, publicKey, setSlice, wallet?.adapter.name, walletAdapter]);

  const handleConnect = useCallback(async () => {
    setSlice("solana", { connecting: true });

    try {
      if (isInWalletInAppBrowser()) {
        const { address: connectedAddress, adapter } = await connectInAppBrowserSolanaWallet(
          wallets.map((entry) => entry.adapter),
        );
        applyConnectedSolanaAdapter(adapter, connectedAddress);
        return connectedAddress;
      }

      if (wallet) {
        await connect();
        return publicKey?.toBase58();
      }

      setVisible(true);
      return undefined;
    } finally {
      setSlice("solana", { connecting: false });
    }
  }, [applyConnectedSolanaAdapter, connect, publicKey, setSlice, setVisible, wallet, wallets]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setFundingWalletInstance(null);
    setSlice("solana", {
      address: undefined,
      connected: false,
      connecting: false,
      walletName: undefined,
    });
  }, [disconnect, setSlice]);

  const handleConnectRef = useRef(handleConnect);
  const handleDisconnectRef = useRef(handleDisconnect);

  useEffect(() => {
    handleConnectRef.current = handleConnect;
    handleDisconnectRef.current = handleDisconnect;
  });

  useEffect(() => {
    registerConnectHandler("solana", () => handleConnectRef.current());
    registerDisconnectHandler("solana", () => handleDisconnectRef.current());
  }, [registerConnectHandler, registerDisconnectHandler]);

  return <SolanaWalletSelectorModal />;
}

export function SolanaFundingProvider({ children }: { children: React.ReactNode }) {
  const adapters = useMemo(() => buildSolanaAdapters(), []);
  const endpoint = useMemo(
    () => FUNDING_NETWORKS.solana.rpcUrls[0] ?? FUNDING_NETWORKS.solana.defaultRpcUrl,
    [],
  );
  const endpointConfig = useMemo(() => {
    const { headers } = generateRpcSignature("solana");
    return { commitment: "confirmed" as const, httpHeaders: headers };
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={endpointConfig}>
      <WalletProvider wallets={adapters} autoConnect={false}>
        <SolanaWalletModalProvider>
          {children}
          <SolanaFundingBridge />
        </SolanaWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
