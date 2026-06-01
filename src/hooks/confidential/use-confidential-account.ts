"use client";

import { useCallback, useEffect, useState } from "react";

import { getConfidentialSession } from "@/lib/confidential/client";

export interface UseConfidentialAccountResult {
  loading: boolean;
  authenticated: boolean;
  /** EOA the Confidential account is derived from (for user confirmation). */
  eoaAddress?: string;
  /** The Confidential account id (Private Account address). */
  intentsUserId?: string;
  /** True once the server verified the account is not tampered with. */
  verified: boolean;
  error?: string;
  refetch: () => Promise<void>;
}

/**
 * Loads the Confidential session handed over from the main site via the
 * cross-subdomain cookie. The server re-derives and verifies the account, so a
 * truthy `authenticated`/`verified` means the Private Account is trustworthy.
 */
export function useConfidentialAccount(): UseConfidentialAccountResult {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [eoaAddress, setEoaAddress] = useState<string | undefined>(undefined);
  const [intentsUserId, setIntentsUserId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const session = await getConfidentialSession();
      setAuthenticated(session.authenticated);
      setEoaAddress(session.eoaAddress);
      setIntentsUserId(session.intentsUserId);
    } catch (caught) {
      setAuthenticated(false);
      setEoaAddress(undefined);
      setIntentsUserId(undefined);
      setError(caught instanceof Error ? caught.message : "Unable to load Private Account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    loading,
    authenticated,
    eoaAddress,
    intentsUserId,
    verified: authenticated && Boolean(intentsUserId),
    error,
    refetch,
  };
}
