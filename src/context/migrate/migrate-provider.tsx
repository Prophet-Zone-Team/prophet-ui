"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/auth";
import { MigrateContext } from "@/context/migrate/migrate-context";
import { executeLegacyMigration } from "@/lib/trading/migrate/execute-migration";
import { scanLegacyBalances } from "@/lib/trading/migrate/legacy-balances";
import type { LegacyBalanceSnapshot } from "@/lib/trading/migrate/types";
import { isTradingSetupComplete } from "@/lib/trading/trading-setup";
import {
  useMigratePromptHydrated,
  useMigratePromptStore,
} from "@/store/use-migrate-prompt-store";
import type { MigrateDialogStep } from "@/views/portfolio/migrate/types";

interface MigrateProviderProps {
  children: ReactNode;
}

export function MigrateProvider({ children }: MigrateProviderProps) {
  const { session, readiness, syncCash } = useAuth();
  const promptHydrated = useMigratePromptHydrated();
  const hasAutoPrompted = useMigratePromptStore((state) => state.hasAutoPrompted);
  const markAutoPrompted = useMigratePromptStore((state) => state.markAutoPrompted);

  const [snapshot, setSnapshot] = useState<LegacyBalanceSnapshot | undefined>();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<MigrateDialogStep>("prompt");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const autoPromptAttemptedRef = useRef<string | undefined>(undefined);
  const scanRequestRef = useRef(0);

  const walletAddress = session?.walletAddress;
  const funderAddress = session?.funderAddress;
  const setupComplete = isTradingSetupComplete(readiness);
  const hasMigratableBalance = Boolean(snapshot?.hasMigratableBalance);

  const refreshLegacyBalances = useCallback(async () => {
    if (!walletAddress || !setupComplete) {
      setSnapshot(undefined);
      setScanError(undefined);
      return;
    }

    const requestId = scanRequestRef.current + 1;
    scanRequestRef.current = requestId;
    setScanning(true);
    setScanError(undefined);

    try {
      const nextSnapshot = await scanLegacyBalances(walletAddress);

      if (scanRequestRef.current !== requestId) {
        return;
      }

      setSnapshot(nextSnapshot);
    } catch (error) {
      if (scanRequestRef.current !== requestId) {
        return;
      }

      setSnapshot(undefined);
      setScanError(error instanceof Error ? error.message : String(error));
    } finally {
      if (scanRequestRef.current === requestId) {
        setScanning(false);
      }
    }
  }, [setupComplete, walletAddress]);

  useEffect(() => {
    autoPromptAttemptedRef.current = undefined;
    setDialogOpen(false);
    setDialogStep("prompt");
    setSubmitError(undefined);

    if (!walletAddress || !setupComplete) {
      setSnapshot(undefined);
      setScanError(undefined);
      return;
    }

    void refreshLegacyBalances();

    const timer = setInterval(() => {
      void refreshLegacyBalances();
    }, 30_000);

    return () => {
      clearInterval(timer);
    };
  }, [refreshLegacyBalances, setupComplete, walletAddress]);

  useEffect(() => {
    console.log("auto open promptHydrated: %o", promptHydrated);
    console.log("auto open walletAddress: %o", walletAddress);
    console.log("auto open setupComplete: %o", setupComplete);
    console.log("auto open snapshot?.hasMigratableBalance: %o", snapshot?.hasMigratableBalance);
    console.log("auto open dialogOpen: %o", dialogOpen);

    if (
      !promptHydrated ||
      !walletAddress ||
      !setupComplete ||
      !snapshot?.hasMigratableBalance ||
      dialogOpen
    ) {
      return;
    }

    console.log("auto open hasAutoPrompted(walletAddress): %o", hasAutoPrompted(walletAddress));
    console.log("auto open autoPromptAttemptedRef.current: %o", autoPromptAttemptedRef.current);

    if (hasAutoPrompted(walletAddress)) {
      return;
    }

    if (autoPromptAttemptedRef.current === walletAddress) {
      return;
    }

    console.log("auto open OPEN!!!!!!");

    autoPromptAttemptedRef.current = walletAddress;
    markAutoPrompted(walletAddress);
    setDialogStep("prompt");
    setDialogOpen(true);
  }, [
    dialogOpen,
    hasAutoPrompted,
    markAutoPrompted,
    promptHydrated,
    setupComplete,
    snapshot?.hasMigratableBalance,
    walletAddress,
  ]);

  const openMigrateDialog = (step: MigrateDialogStep = "setup") => {
    setSubmitError(undefined);
    setDialogStep(step);
    setDialogOpen(true);
  };

  const closeMigrateDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setSubmitError(undefined);
  };

  const executeMigration = async (amountUsd: number) => {
    if (!walletAddress || !funderAddress || !snapshot?.bestAccount) {
      throw new Error("Migration source account is unavailable.");
    }

    setSubmitting(true);
    setSubmitError(undefined);

    try {
      await executeLegacyMigration({
        ownerAddress: walletAddress,
        destinationOwner: walletAddress,
        destinationDepositWallet: funderAddress,
        sourceAccount: snapshot.bestAccount,
        amountUsd,
      });

      await refreshLegacyBalances();
      await syncCash();
      setDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSubmitError(message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MigrateContext.Provider
      value={{
        snapshot,
        scanning,
        scanError,
        hasMigratableBalance,
        dialogOpen,
        dialogStep,
        submitting,
        submitError,
        refreshLegacyBalances,
        openMigrateDialog,
        closeMigrateDialog,
        setDialogStep,
        executeMigration,
      }}
    >
      {children}
    </MigrateContext.Provider>
  );
}
