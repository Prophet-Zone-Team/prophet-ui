"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  isCopyWalletReady,
  refreshCopyWalletIfStale,
} from "@/lib/copy-trade/auth";
import {
  enableProfilePatch,
  formToApiTarget,
  normalizeTargetForm,
  targetFormToProfilePatch,
  targetToForm,
  validateProfileDefaults,
  validateTargetForm,
  type CopyTargetForm
} from "@/lib/copy-trade/transforms";
import {
  updateCopyTradeProfile,
  updateCopyTradeTargets
} from "@/service/copy-trade";
import {
  useCopyTradeStore,
  useCopyTradeStoredSession
} from "@/store/copy-trade-store";
import type {
  CopyProfileUpdateRequest,
  CopyTarget
} from "@/types/copy-trade-api";

import { useCopyTradeProfile } from "./use-copy-trade-profile";
import { useCopyTradeSession } from "./use-copy-trade-session";
import { useCopyTradeTargets } from "./use-copy-trade-targets";

function isLiveCopyForm(form: CopyTargetForm): boolean {
  return form.enabled && !form.dryRun && (form.buyEnabled || form.sellEnabled);
}

function resolveProfileFormForWrite(
  profileForm: CopyTargetForm | undefined,
  nextForms: CopyTargetForm[]
): CopyTargetForm | undefined {
  if (profileForm) {
    return profileForm;
  }

  return nextForms.find(isLiveCopyForm);
}

export function useCopyActions() {
  const t = useTranslations("copyTrade.toast");
  const { userId } = useCopyTradeSession();
  const session = useCopyTradeStoredSession();
  const copyWallet = session?.copyWallet ?? null;
  const updateCopyWallet = useCopyTradeStore((state) => state.updateCopyWallet);
  const { targets, refetch: refetchTargets } = useCopyTradeTargets();
  const { profile, refetch: refetchProfile } = useCopyTradeProfile();
  const [saving, setSaving] = useState(false);

  const guard = useCallback((): boolean => {
    if (!userId) {
      toast.error(t("createAccountFirst"));
      return false;
    }

    return true;
  }, [t, userId]);

  const refresh = useCallback(async () => {
    await Promise.all([refetchTargets(), refetchProfile()]);
  }, [refetchProfile, refetchTargets]);

  const currentForms = useCallback(
    (): CopyTargetForm[] => targets.map(targetToForm),
    [targets]
  );

  const writeTargets = useCallback(
    async (
      nextForms: CopyTargetForm[],
      ensureMaster: boolean,
      okMessage: string,
      loadingMessage = t("updatingCopyTarget"),
      profileForm?: CopyTargetForm
    ): Promise<boolean> => {
      if (!guard() || !userId) {
        return false;
      }

      for (const form of nextForms) {
        const errors = validateTargetForm(form);
        if (errors.length > 0) {
          toast.error(errors[0]);
          return false;
        }
      }

      setSaving(true);
      const toastId = toast.loading(loadingMessage);

      try {
        if (ensureMaster) {
          const wallet = await refreshCopyWalletIfStale(
            userId,
            copyWallet,
            updateCopyWallet,
          );

          if (!isCopyWalletReady(wallet)) {
            toast.error(t("approvalsIncomplete"), { id: toastId });
            return false;
          }

          const profileSource = resolveProfileFormForWrite(
            profileForm,
            nextForms
          );

          await updateCopyTradeProfile(
            userId,
            profileSource
              ? targetFormToProfilePatch(profileSource, { enabled: true })
              : enableProfilePatch(profile)
          );
        }

        await updateCopyTradeTargets(userId, {
          items: nextForms.map(formToApiTarget)
        });
        await refresh();
        toast.success(okMessage, { id: toastId });
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("unableToSaveCopyTarget"),
          { id: toastId }
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [copyWallet, guard, profile, refresh, t, updateCopyWallet, userId]
  );

  const upsertCopy = useCallback(
    async (form: CopyTargetForm): Promise<boolean> => {
      const normalized = normalizeTargetForm(form);
      const wallet = normalized.wallet.toLowerCase();
      const forms = currentForms();
      const exists = forms.some((item) => item.wallet === wallet);
      const next = exists
        ? forms.map((item) => (item.wallet === wallet ? normalized : item))
        : [...forms, normalized];
      const live = isLiveCopyForm(normalized);

      return writeTargets(
        next,
        live,
        live ? t("liveCopyStarted") : t("copyTargetSavedDryRun"),
        t("savingCopyTarget"),
        live ? normalized : undefined
      );
    },
    [currentForms, writeTargets, t]
  );

  const updateCopySettings = useCallback(
    async (form: CopyTargetForm): Promise<boolean> => {
      const normalized = normalizeTargetForm(form);
      const wallet = normalized.wallet.toLowerCase();
      const next = currentForms().map((item) =>
        item.wallet === wallet ? normalized : item
      );
      const live = isLiveCopyForm(normalized);

      return writeTargets(
        next,
        live,
        t("copySettingsSaved"),
        t("savingCopySettings"),
        live ? normalized : undefined
      );
    },
    [currentForms, writeTargets, t]
  );

  const removeCopy = useCallback(
    async (wallet: string): Promise<boolean> => {
      const normalizedWallet = wallet.toLowerCase();
      return writeTargets(
        currentForms().filter((item) => item.wallet !== normalizedWallet),
        false,
        t("copyTargetRemoved"),
        t("removingCopyTarget")
      );
    },
    [currentForms, writeTargets]
  );

  const patchCopy = useCallback(
    async (
      target: CopyTarget,
      patch: Partial<CopyTargetForm>,
      okMessage: string,
      loadingMessage?: string
    ): Promise<boolean> => {
      const form = { ...targetToForm(target), ...patch };
      const live = isLiveCopyForm(form);
      const next = currentForms().map((item) =>
        item.wallet === form.wallet ? form : item
      );

      return writeTargets(
        next,
        live,
        okMessage,
        loadingMessage,
        live ? normalizeTargetForm(form) : undefined
      );
    },
    [currentForms, writeTargets]
  );

  const setPaused = useCallback(
    (target: CopyTarget, paused: boolean) =>
      patchCopy(
        target,
        { enabled: !paused },
        paused ? t("copyTargetPaused") : t("copyTargetResumed"),
        paused ? t("pausingCopyTarget") : t("resumingCopyTarget")
      ),
    [patchCopy]
  );

  const saveDefaults = useCallback(
    async (body: CopyProfileUpdateRequest) => {
      if (!guard() || !userId) {
        return;
      }

      const errors = validateProfileDefaults(body);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      setSaving(true);
      const toastId = toast.loading(t("savingDefaultParams"));

      try {
        await updateCopyTradeProfile(userId, body);
        await refresh();
        toast.success(t("defaultParamsSaved"), { id: toastId });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("unableToSaveDefaultParams"),
          { id: toastId }
        );
      } finally {
        setSaving(false);
      }
    },
    [guard, refresh, t, userId]
  );

  return {
    saving,
    upsertCopy,
    updateCopySettings,
    removeCopy,
    setPaused,
    patchCopy,
    saveDefaults
  };
}
