"use client";

import { createContext } from "react";

import type { LegacyBalanceSnapshot } from "@/lib/trading/migrate/types";
import type { MigrateDialogStep } from "@/views/portfolio/migrate/types";

export interface MigrateContextValue {
  snapshot?: LegacyBalanceSnapshot;
  scanning: boolean;
  scanError?: string;
  hasMigratableBalance: boolean;
  dialogOpen: boolean;
  dialogStep: MigrateDialogStep;
  submitting: boolean;
  submitError?: string;
  refreshLegacyBalances: () => Promise<void>;
  openMigrateDialog: (step?: MigrateDialogStep) => void;
  closeMigrateDialog: () => void;
  setDialogStep: (step: MigrateDialogStep) => void;
  executeMigration: (amountUsd: number) => Promise<void>;
}

export const MigrateContext = createContext<MigrateContextValue | null>(null);
