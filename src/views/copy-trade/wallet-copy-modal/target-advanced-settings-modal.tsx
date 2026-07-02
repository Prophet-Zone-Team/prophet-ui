"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  isValidPriceInput,
  isValidSlippageInput,
  isValidUsdCapInput,
  normalizeTargetForm,
  targetToWalletCopyForm,
  validateTargetForm,
  type CopyTargetForm
} from "@/lib/copy-trade/transforms";
import type { CopyTarget } from "@/types/copy-trade-api";

import { WalletCopyAdvancedSettingsModal } from "./advanced-settings-modal";
import { buildTargetFormFromWalletCopy } from "./index";
import {
  applyAdvancedFields,
  pickAdvancedFields,
  pickDefaultAdvancedFields,
  type WalletCopyAdvancedFields,
  type WalletCopyFormValues
} from "./types";

export interface WalletCopyTargetAdvancedSettingsModalProps {
  open: boolean;
  onClose: () => void;
  target: CopyTarget | null;
  saving?: boolean;
  onPersist: (form: CopyTargetForm) => Promise<boolean>;
}

function withFixedCopyPolicy(
  values: WalletCopyFormValues
): WalletCopyFormValues {
  return {
    ...values,
    buyTakerOnly: true,
    sellTakerOnly: true,
    orderType: "FAK"
  };
}

export function WalletCopyTargetAdvancedSettingsModal({
  open,
  onClose,
  target,
  saving = false,
  onPersist
}: WalletCopyTargetAdvancedSettingsModalProps) {
  const baseForm = useMemo(
    () => (target ? targetToWalletCopyForm(target) : null),
    [target]
  );
  const [advancedDraft, setAdvancedDraft] = useState<WalletCopyAdvancedFields>(
    () => pickDefaultAdvancedFields()
  );

  useEffect(() => {
    if (!open || !baseForm) {
      return;
    }

    setAdvancedDraft(pickAdvancedFields(baseForm));
  }, [baseForm, open, target?.Wallet]);

  const savedAdvanced = useMemo(
    () => (baseForm ? pickAdvancedFields(baseForm) : pickDefaultAdvancedFields()),
    [baseForm]
  );

  const advancedDraftFieldErrors = useMemo(
    () => ({
      maxUsdPerTrade: !isValidUsdCapInput(advancedDraft.maxUsdPerTrade),
      maxUsdPerMarket: !isValidUsdCapInput(advancedDraft.maxUsdPerMarket),
      maxUsdPerHour: !isValidUsdCapInput(advancedDraft.maxUsdPerHour),
      maxUsdTotal: !isValidUsdCapInput(advancedDraft.maxUsdTotal),
      minPrice: !isValidPriceInput(advancedDraft.minPrice),
      maxPrice: !isValidPriceInput(advancedDraft.maxPrice),
      maxSlippage: !isValidSlippageInput(advancedDraft.maxSlippage)
    }),
    [advancedDraft]
  );

  const hasAdvancedDraftFieldErrors = useMemo(
    () => Object.values(advancedDraftFieldErrors).some(Boolean),
    [advancedDraftFieldErrors]
  );

  const handleClose = useCallback(() => {
    if (baseForm) {
      setAdvancedDraft(pickAdvancedFields(baseForm));
    }
    onClose();
  }, [baseForm, onClose]);

  const handleClearAdvancedDraft = useCallback(() => {
    setAdvancedDraft(pickDefaultAdvancedFields());
  }, []);

  const handleSave = useCallback(async () => {
    if (!target || !baseForm || hasAdvancedDraftFieldErrors) {
      return;
    }

    const nextForm = withFixedCopyPolicy(
      applyAdvancedFields(baseForm, advancedDraft)
    );
    const draft = buildTargetFormFromWalletCopy(
      target.Wallet,
      nextForm,
      target
    );
    const errors = validateTargetForm(draft);
    if (errors.length > 0) {
      return;
    }

    let normalized: CopyTargetForm;
    try {
      normalized = normalizeTargetForm(draft);
    } catch {
      return;
    }

    const ok = await onPersist(normalized);
    if (ok) {
      onClose();
    }
  }, [
    advancedDraft,
    baseForm,
    hasAdvancedDraftFieldErrors,
    onClose,
    onPersist,
    target
  ]);

  if (!target) {
    return null;
  }

  return (
    <WalletCopyAdvancedSettingsModal
      open={open}
      draft={advancedDraft}
      savedAdvanced={savedAdvanced}
      saving={saving}
      onDraftChange={(patch) =>
        setAdvancedDraft((current) => ({ ...current, ...patch }))
      }
      onSave={() => {
        void handleSave();
      }}
      onClose={handleClose}
      onClear={handleClearAdvancedDraft}
    />
  );
}
