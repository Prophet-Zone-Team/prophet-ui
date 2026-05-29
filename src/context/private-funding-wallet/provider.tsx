"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, cookieToInitialState } from "wagmi";

import { privateFundingWagmiConfig } from "@/context/private-funding-wallet/wagmi-config";
import { PrivateFundingConnectGate } from "@/context/private-funding-wallet/connect-gate";

const queryClient = new QueryClient();

export function PrivateFundingWalletProvider({
  children,
  cookie,
}: {
  children: React.ReactNode;
  cookie?: string | null;
}) {
  const initialState = cookieToInitialState(privateFundingWagmiConfig, cookie);

  return (
    <WagmiProvider config={privateFundingWagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" locale="en-US">
          <PrivateFundingConnectGate>{children}</PrivateFundingConnectGate>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
