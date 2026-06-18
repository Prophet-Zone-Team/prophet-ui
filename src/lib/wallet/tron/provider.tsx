"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BinanceWalletAdapter,
  MetaMaskAdapter,
  OkxWalletAdapter,
  TronLinkAdapter,
  WalletConnectAdapter,
  TokenPocketAdapter,
} from "@tronweb3/tronwallet-adapters";
import { TronWeb } from "tronweb";

import { isInWalletInAppBrowser } from "@/context/rainbowkit/utils";
import { generateRpcSignature } from "@/config/funding/signature";
import { connectInAppBrowserTronWallet } from "@/lib/wallet/tron/connect-in-app-browser";
import { setTronFundingWalletInstance } from "@/lib/wallet/tron/funding-wallet-instance";
import { createTronWeb } from "@/lib/wallet/tron/tron-web";
import TronFundingWallet from "@/lib/wallet/tron/wallet";
import { TronWalletSelectorModal } from "@/lib/wallet/tron/wallet-selector-modal";
import { useFundingWalletStore } from "@/store/use-funding-wallet-store";
import { useDevice } from "@/hooks/common/use-device";

function buildTronAdapters() {
  const projectId = process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID ?? "";

  return [
    new TronLinkAdapter(),
    new OkxWalletAdapter(),
    new TokenPocketAdapter(),
    new MetaMaskAdapter({ openAppWithDeeplink: false }),
    new BinanceWalletAdapter(),
    ...(projectId
      ? [
          new WalletConnectAdapter({
            network: "Mainnet",
            options: {
              projectId,
              metadata: {
                name: "Prophet",
                description: "Prophet funding wallet",
                url: typeof window !== "undefined" ? window.location.origin : "https://app.prophet.zone",
                icons: [],
              },
            },
          }),
        ]
      : []),
  ];
}

export function TronFundingProvider({ children }: { children: React.ReactNode }) {
  const adapters = useMemo(() => buildTronAdapters(), []);
  const [activeAdapter, setActiveAdapter] = useState<ReturnType<typeof buildTronAdapters>[number] | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const walletRef = useRef<TronFundingWallet | null>(null);
  const setSlice = useFundingWalletStore((state) => state.setSlice);
  const registerConnectHandler = useFundingWalletStore((state) => state.registerConnectHandler);
  const registerDisconnectHandler = useFundingWalletStore((state) => state.registerDisconnectHandler);
  const ismobile = useDevice();

  const installedWallets = useMemo(
    () => adapters.filter((adapter) => adapter.readyState === "Found"),
    [adapters],
  );

  const syncWalletInstance = useCallback((address?: string, adapter?: typeof activeAdapter) => {
    const resolvedAddress = address || adapter?.address;

    if (!resolvedAddress || !adapter) {
      walletRef.current = null;
      setTronFundingWalletInstance(null);
      return;
    }

    const tronWeb = createTronWeb(resolvedAddress);
    const instance = new TronFundingWallet({
      address: resolvedAddress,
      signAndSendTransaction: async (transaction: unknown) => {
        const rpcSignature = generateRpcSignature("tron");
        tronWeb.setHeader(rpcSignature.headers);
        const signedTx = await adapter.signTransaction(transaction as Parameters<TronWeb["trx"]["sendRawTransaction"]>[0]);
        return tronWeb.trx.sendRawTransaction(signedTx);
      },
    });

    walletRef.current = instance;
    setTronFundingWalletInstance(instance);
  }, []);

  const applyConnectedAdapter = useCallback(
    (adapter: (typeof adapters)[number]) => {
      setActiveAdapter(adapter);
      syncWalletInstance(adapter.address ?? undefined, adapter);
      setSlice("tron", {
        address: adapter.address ?? undefined,
        connected: Boolean(adapter.address),
        connecting: false,
        walletName: adapter.name,
      });
    },
    [setSlice, syncWalletInstance],
  );

  const handleDisconnect = useCallback(async () => {
    if (activeAdapter) {
      await activeAdapter.disconnect();
    }

    setActiveAdapter(null);
    syncWalletInstance();
    setSlice("tron", {
      address: undefined,
      connected: false,
      connecting: false,
      walletName: undefined,
    });
  }, [activeAdapter, setSlice, syncWalletInstance]);

  const handleConnect = useCallback(async (): Promise<string | undefined> => {
    setConnecting(true);

    try {
      if (isInWalletInAppBrowser() && ismobile) {
        const { address, adapter } = await connectInAppBrowserTronWallet(adapters);
        applyConnectedAdapter(adapter);
        return address;
      }

      setSelectorOpen(true);

      if (installedWallets.length === 1) {
        const adapter = installedWallets[0];
        await adapter.connect();
        applyConnectedAdapter(adapter);
        setSelectorOpen(false);
        return adapter.address ?? undefined;
      }

      return undefined;
    } finally {
      setConnecting(false);
    }
  }, [adapters, applyConnectedAdapter, installedWallets, ismobile]);

  const handleSelectWallet = useCallback(
    async (walletName: string) => {
      const adapter = adapters.find((entry) => entry.name === walletName);

      if (!adapter) {
        return;
      }

      setConnecting(true);

      try {
        await adapter.connect();
        applyConnectedAdapter(adapter);
        setSelectorOpen(false);
      } finally {
        setConnecting(false);
      }
    },
    [adapters, applyConnectedAdapter],
  );

  const handleConnectRef = useRef(handleConnect);
  const handleDisconnectRef = useRef(handleDisconnect);

  handleConnectRef.current = handleConnect;
  handleDisconnectRef.current = handleDisconnect;

  useEffect(() => {
    registerConnectHandler("tron", () => handleConnectRef.current());
    registerDisconnectHandler("tron", () => handleDisconnectRef.current());
  }, [registerConnectHandler, registerDisconnectHandler]);

  useEffect(() => {
    if (!activeAdapter) {
      return;
    }

    const onConnect = (address: string) => {
      syncWalletInstance(address, activeAdapter);
      setSlice("tron", {
        address,
        connected: true,
        connecting: false,
        walletName: activeAdapter.name,
      });
    };

    const onDisconnect = () => {
      void handleDisconnect();
    };

    const onAccountsChanged = (accounts: string[] | string | null) => {
      const nextAddress = Array.isArray(accounts) ? accounts[0] : accounts;
      syncWalletInstance(nextAddress ?? undefined, activeAdapter);
      setSlice("tron", {
        address: nextAddress ?? undefined,
        connected: Boolean(nextAddress),
        connecting: false,
        walletName: activeAdapter.name,
      });
    };

    activeAdapter.on("connect", onConnect);
    activeAdapter.on("disconnect", onDisconnect);
    activeAdapter.on("accountsChanged", onAccountsChanged);

    return () => {
      activeAdapter.removeAllListeners();
    };
  }, [activeAdapter, handleDisconnect, setSlice, syncWalletInstance]);

  return (
    <>
      {children}
      <TronWalletSelectorModal
        open={selectorOpen}
        connecting={connecting}
        wallets={adapters.map((adapter) => ({
          name: adapter.name,
          icon: adapter.icon,
          readyState: adapter.readyState,
          adapter,
        }))}
        onClose={() => setSelectorOpen(false)}
        onSelect={(wallet) => void handleSelectWallet(wallet.name)}
      />
    </>
  );
}
