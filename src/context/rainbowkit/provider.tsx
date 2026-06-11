"use client";

import React from "react";
import { cookieToInitialState, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";

import { RainbowConnectGate } from "@/context/rainbowkit/connect-gate";
import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  PRIVY_APP_ID,
  PRIVY_CLIENT_ID,
  privyConfig,
} from "@/context/privy/privy-config";
import { PrivyWalletBridge } from "@/context/privy/privy-wallet-bridge";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

const queryClient = new QueryClient();

export default function RainbowProvider({
  children,
  cookie,
}: {
  children: React.ReactNode;
  cookie?: string | null;
}) {
  // const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  if (!PRIVY_APP_ID && typeof window !== "undefined") {
    console.warn(
      "[privy] NEXT_PUBLIC_PRIVY_APP_ID is not set. Authentication will not work.",
    );
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} initialState={initialState}>
          <RainbowKitProvider modalSize="compact" locale="en-US">
            <PrivyWalletBridge />
            <RainbowConnectGate>{children}</RainbowConnectGate>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
