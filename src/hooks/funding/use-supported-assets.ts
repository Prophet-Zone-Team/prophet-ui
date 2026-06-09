"use client";

import { useCallback, useEffect, useState } from "react";

import type { FundingAsset } from "@/config/funding";
import { fetchSupportedFundingAssets } from "@/lib/funding/supported-assets";

export interface UseSupportedAssetsOptions {
  enabled?: boolean;
}

export interface UseSupportedAssetsResult {
  supportedAssets: FundingAsset[];
  loading: boolean;
  error: string | undefined;
  reload: () => Promise<void>;
}

export function useSupportedAssets(options?: UseSupportedAssetsOptions): UseSupportedAssetsResult {
  const enabled = options?.enabled ?? true;
  const [supportedAssets, setSupportedAssets] = useState<FundingAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const assets = await fetchSupportedFundingAssets();
      setSupportedAssets(assets);
    } catch (fetchError) {
      setSupportedAssets([]);
      setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void reload();
  }, [enabled, reload]);

  return {
    supportedAssets,
    loading,
    error,
    reload,
  };
}
