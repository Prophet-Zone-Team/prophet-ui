"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const TronFundingClient = dynamic(
  () =>
    import("@/lib/wallet/tron/tron-funding-client").then(
      (module) => module.TronFundingClient
    ),
  { ssr: false }
);

export function TronFundingProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <TronFundingClient />
    </>
  );
}
