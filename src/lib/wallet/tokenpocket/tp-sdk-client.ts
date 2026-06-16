"use client";

type TpSdkModule = {
  getCurrentWallet: () => Promise<{
    result: boolean;
    data?: {
      blockchain?: string;
      address?: string;
    };
  }>;
  getWallet: (params: {
    walletTypes: string[];
    switch: boolean;
  }) => Promise<{ result: boolean }>;
};

let tpSdkPromise: Promise<TpSdkModule> | undefined;

export async function getTpSdk(): Promise<TpSdkModule> {
  if (!tpSdkPromise) {
    tpSdkPromise = import("tp-js-sdk").then((module) => {
      const sdk = (module as { default?: TpSdkModule }).default ?? module;

      return sdk as TpSdkModule;
    });
  }

  return tpSdkPromise;
}
