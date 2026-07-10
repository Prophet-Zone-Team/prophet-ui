"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import {
  COPY_TRANSFER_DEPOSIT_POLL_INTERVAL_MS,
  isCopyTransferDepositFailure,
  isCopyTransferDepositSuccess,
  isCopyTransferDepositTerminal
} from "@/lib/copy-trade/transfer-deposit";
import {
  getCopyTradeTransferDeposit
} from "@/service/copy-trade";
import type { CopyTransferDeposit } from "@/types/copy-trade-funding";

export interface UseCopyTradeTransferDepositStatusOptions {
  open: boolean;
  txHash: string;
  onCredited?: (amountPusd: number) => void;
}

export interface UseCopyTradeTransferDepositStatusResult {
  record: CopyTransferDeposit | null;
  loading: boolean;
  errorText: string | undefined;
  isTerminal: boolean;
  isSuccess: boolean;
  isFailure: boolean;
}

export function useCopyTradeTransferDepositStatus(
  options: UseCopyTradeTransferDepositStatusOptions
): UseCopyTradeTransferDepositStatusResult {
  const { open, txHash, onCredited } = options;

  const { syncCash } = useAuth();
  const onCreditedRef = useRef(onCredited);
  const lastCreditedAtRef = useRef(0);
  const pollInFlightRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [record, setRecord] = useState<CopyTransferDeposit | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();

  useEffect(() => {
    onCreditedRef.current = onCredited;
  }, [onCredited]);

  const refreshStatus = useCallback(async () => {
    if (!txHash || pollInFlightRef.current) {
      return;
    }

    pollInFlightRef.current = true;
    setLoading(true);
    try {
      const next = await getCopyTradeTransferDeposit(txHash);
      setRecord(next);
      setErrorText(undefined);

      if (isCopyTransferDepositSuccess(next.status)) {
        const now = Date.now();
        if (now - lastCreditedAtRef.current > 1_000) {
          lastCreditedAtRef.current = now;
          onCreditedRef.current?.(next.amount_pusd);
          await syncCash();
        }
      } else if (isCopyTransferDepositFailure(next.status)) {
        setErrorText(next.error || next.status);
      }

      if (isCopyTransferDepositTerminal(next.status) && pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
    } finally {
      pollInFlightRef.current = false;
      setLoading(false);
    }
  }, [syncCash, txHash]);

  useEffect(() => {
    if (!open || !txHash) {
      return undefined;
    }

    setRecord(null);
    setErrorText(undefined);
    lastCreditedAtRef.current = 0;

    void refreshStatus();
    pollTimerRef.current = setInterval(() => {
      void refreshStatus();
    }, COPY_TRANSFER_DEPOSIT_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, refreshStatus, txHash]);

  const status = record?.status;
  const isTerminal = isCopyTransferDepositTerminal(status);
  const isSuccess = isCopyTransferDepositSuccess(status);
  const isFailure = isCopyTransferDepositFailure(status);

  return {
    record,
    loading,
    errorText,
    isTerminal,
    isSuccess,
    isFailure
  };
}
