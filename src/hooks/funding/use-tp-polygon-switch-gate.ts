"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { TP_BLOCKCHAIN_POLYGON } from "@/lib/wallet/tokenpocket/constants";
import { throwTpFundingSwitchPending } from "@/lib/wallet/tokenpocket/ensure-tp-wallet";
import {
  isTpFundingSwitchPendingError,
} from "@/lib/wallet/tokenpocket/tp-funding-switch";
import {
  isTpNonEvmWalletActive,
  switchTpToMaticWallet,
} from "@/lib/wallet/tokenpocket/tp-evm-wallet-gate";
import { useDevice } from "../common/use-device";
import { isInTokenPocket } from "@/context/rainbowkit/utils";

export type TpPolygonSwitchVariant = "convert" | "close";

export function useTpPolygonSwitchGate() {
  const isMobile = useDevice();

  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switchDialogVariant, setSwitchDialogVariant] =
    useState<TpPolygonSwitchVariant>("convert");
  const [switchLoading, setSwitchLoading] = useState(false);
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);
  const pendingCloseRef = useRef<(() => void) | null>(null);

  const openSwitchDialog = useCallback(
    (
      variant: TpPolygonSwitchVariant,
      action?: () => Promise<void>,
      closeAction?: () => void,
    ) => {
      setSwitchDialogVariant(variant);
      pendingActionRef.current = action ?? null;
      pendingCloseRef.current = closeAction ?? null;
      setSwitchDialogOpen(true);
    },
    [],
  );

  const onCancelSwitch = useCallback(() => {
    setSwitchDialogOpen(false);
    pendingActionRef.current = null;
    pendingCloseRef.current = null;
  }, []);

  const onConfirmSwitch = useCallback(async () => {
    setSwitchLoading(true);

    try {
      const result = await switchTpToMaticWallet();
      setSwitchDialogOpen(false);

      if (result.reloadPending) {
        pendingActionRef.current = null;
        pendingCloseRef.current = null;
        throwTpFundingSwitchPending(TP_BLOCKCHAIN_POLYGON);
      }

      const action = pendingActionRef.current;
      const closeAction = pendingCloseRef.current;
      pendingActionRef.current = null;
      pendingCloseRef.current = null;

      if (action) {
        await action();
      } else if (closeAction) {
        closeAction();
      }
    } catch (error: unknown) {
      if (isTpFundingSwitchPendingError(error)) {
        toast.message(error.message);
        return;
      }

      const message =
        error instanceof Error ? error.message : "Wallet switch failed.";
      toast.error(message);
    } finally {
      setSwitchLoading(false);
    }
  }, []);

  const runWithTpPolygonGate = useCallback(
    async (
      action: () => Promise<void>,
      variant: TpPolygonSwitchVariant = "convert",
    ) => {
      if (isMobile && isInTokenPocket()) {
        if (!(await isTpNonEvmWalletActive())) {
          await action();
          return;
        }
      }

      openSwitchDialog(variant, action);
    },
    [openSwitchDialog, isMobile],
  );

  const requestCloseWithTpPolygonGate = useCallback(
    async (onCloseAllowed: () => void) => {
      if (!(await isTpNonEvmWalletActive())) {
        onCloseAllowed();
        return;
      }

      openSwitchDialog("close", undefined, onCloseAllowed);
    },
    [openSwitchDialog],
  );

  return {
    switchDialogOpen,
    switchDialogVariant,
    switchLoading,
    onCancelSwitch,
    onConfirmSwitch,
    runWithTpPolygonGate,
    requestCloseWithTpPolygonGate,
  };
}
