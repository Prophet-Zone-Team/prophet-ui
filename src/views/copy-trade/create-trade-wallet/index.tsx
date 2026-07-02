"use client";

import { Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { getCopyTradeBalances } from "@/service/copy-trade";
import {
  selectCopyTradeSession,
  useCopyTradeStore
} from "@/store/copy-trade-store";

import {
  copyTradeModalSurfaceClass,
  copyTradePrimaryButtonClass
} from "@/views/copy-trade/copy-trade-ui";
import { useCopyTradeTest } from "../use-copy-trade-test";

type StepId = "sign-in" | "create-wallet" | "deposit";
type StepVisualState = "pending" | "active" | "done";

export interface CreateTradeWalletModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit?: () => void;
}

function StepIcon({ state }: { state: StepVisualState }) {
  if (state === "active") {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0d69ff]/10 text-[#0d69ff]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      </span>
    );
  }

  if (state === "done") {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#65AF14] text-white">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-prophet-line bg-prophet-panel" />
  );
}

function StepActionButton({
  label,
  disabled,
  loading,
  onClick
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 w-[100px] shrink-0 items-center justify-center rounded-[8px] text-sm font-medium leading-[18px]",
        copyTradePrimaryButtonClass
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        label
      )}
    </button>
  );
}

function resolveStepState(
  stepId: StepId,
  input: {
    isCopyTradeLoggedIn: boolean;
    isWalletCreated: boolean;
    isWalletReady: boolean;
    isWalletPending: boolean;
    busyDeploy: boolean;
    busyBalanceCheck: boolean;
    busyLogin: boolean;
    busyPoll: boolean;
  }
): StepVisualState {
  if (stepId === "sign-in") {
    if (input.busyLogin) {
      return "active";
    }

    if (input.isCopyTradeLoggedIn) {
      return "done";
    }

    return "pending";
  }

  if (stepId === "create-wallet") {
    if (!input.isCopyTradeLoggedIn) {
      return "pending";
    }

    if (
      input.busyDeploy ||
      input.busyPoll ||
      (input.isWalletPending && !input.isWalletReady)
    ) {
      return "active";
    }

    if (input.isWalletCreated) {
      return "done";
    }

    return "pending";
  }

  if (!input.isCopyTradeLoggedIn || !input.isWalletCreated) {
    return "pending";
  }

  if (input.busyBalanceCheck) {
    return "active";
  }

  if (input.isWalletReady) {
    return "done";
  }

  return "pending";
}

async function fetchCopyTradeAvailableBalance(): Promise<number | null> {
  const session = selectCopyTradeSession(useCopyTradeStore.getState());
  const userId = session?.user?.ID;

  if (!userId) {
    return null;
  }

  const balance = await getCopyTradeBalances(userId);
  return balance.Available;
}

export function CreateTradeWalletModal({
  open,
  onClose,
  onDeposit
}: CreateTradeWalletModalProps) {
  const t = useTranslations("copyTrade.createWallet");
  const {
    copyWallet,
    isWalletReady,
    isWalletPending,
    busyDeploy,
    deployCopyWallet,
    loginCopyTrade,
    isCopyTradeLoggedIn,
    busyLogin,
    busyPoll,
    refreshCopyTradeSession,
    pollCopyWalletReady
  } = useCopyTradeTest();
  const [busyBalanceCheck, setBusyBalanceCheck] = useState(false);

  const steps = useMemo(
    () =>
      [
        {
          id: "sign-in" as const,
          title: t("signInTitle"),
          description: t("signInDescription"),
          actionLabel: t("signInAction"),
          loadingLabel: t("signInLoading")
        },
        {
          id: "create-wallet" as const,
          title: t("createTitle"),
          description: t("createDescription"),
          actionLabel: t("createAction"),
          continueLabel: t("createContinue"),
          refreshLabel: t("createRefresh"),
          loadingLabel: t("createLoading")
        },
        {
          id: "deposit" as const,
          title: t("depositTitle"),
          description: t("depositDescription"),
          actionLabel: t("depositAction"),
          loadingLabel: t("depositLoading")
        }
      ] as const,
    [t]
  );

  const isWalletCreated = Boolean(copyWallet);
  const createStepBusy = busyDeploy || busyPoll;

  const checkBalanceAndMaybeClose = useCallback(async () => {
    if (!isWalletReady) {
      return;
    }

    setBusyBalanceCheck(true);
    try {
      const available = await fetchCopyTradeAvailableBalance();
      if (available !== null && available > 0) {
        onClose();
      }
    } catch {
      // Keep the modal open when balance lookup fails.
    } finally {
      setBusyBalanceCheck(false);
    }
  }, [isWalletReady, onClose]);

  const handleSignIn = useCallback(async () => {
    if (isCopyTradeLoggedIn) {
      return;
    }

    await loginCopyTrade();
  }, [isCopyTradeLoggedIn, loginCopyTrade]);

  const handleCreateWallet = useCallback(async () => {
    if (!isCopyTradeLoggedIn) {
      return;
    }

    if (!copyWallet) {
      const started = await deployCopyWallet();
      if (started) {
        await pollCopyWalletReady();
      }
      return;
    }

    if (isWalletPending && !isWalletReady) {
      const started = await deployCopyWallet();
      if (started) {
        await pollCopyWalletReady();
      } else {
        await refreshCopyTradeSession();
      }
      return;
    }

    await refreshCopyTradeSession();
  }, [
    copyWallet,
    deployCopyWallet,
    isCopyTradeLoggedIn,
    isWalletPending,
    isWalletReady,
    pollCopyWalletReady,
    refreshCopyTradeSession
  ]);

  const handleDeposit = useCallback(() => {
    if (!isWalletReady) {
      return;
    }

    onDeposit?.();
  }, [isWalletReady, onDeposit]);

  const createActionLabel = useMemo(() => {
    if (!copyWallet) {
      return steps[1].actionLabel;
    }

    if (isWalletPending && !isWalletReady) {
      return steps[1].continueLabel;
    }

    return steps[1].refreshLabel;
  }, [copyWallet, isWalletPending, isWalletReady, steps]);

  const stepActions = useMemo(
    () => ({
      "sign-in": {
        visible: !isCopyTradeLoggedIn,
        disabled: busyLogin,
        loading: busyLogin,
        onClick: () => void handleSignIn()
      },
      "create-wallet": {
        visible:
          isCopyTradeLoggedIn &&
          (!isWalletCreated || (isWalletPending && !isWalletReady)),
        disabled: !isCopyTradeLoggedIn || createStepBusy,
        loading: createStepBusy,
        onClick: () => void handleCreateWallet()
      },
      deposit: {
        visible: isWalletCreated,
        disabled: !isWalletReady || busyBalanceCheck,
        loading: busyBalanceCheck,
        onClick: handleDeposit
      }
    }),
    [
      busyBalanceCheck,
      busyLogin,
      createStepBusy,
      handleCreateWallet,
      handleDeposit,
      handleSignIn,
      isCopyTradeLoggedIn,
      isWalletCreated,
      isWalletPending,
      isWalletReady
    ]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("ariaLabel")}
      className={cn(copyTradeModalSurfaceClass, "max-w-[556px]")}
      closeButtonClassName="right-5 top-5 border-0 bg-transparent text-prophet-muted hover:bg-transparent hover:text-prophet-foreground"
    >
      <div className="flex flex-col gap-5 pr-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-lg font-medium leading-[23px] text-prophet-foreground">
            {t("modalTitle")}
          </h2>
          <p className="text-sm font-normal leading-[18px] text-prophet-muted">
            {t("modalDescription")}
          </p>
        </header>

        <ol className="m-0 flex list-none flex-col gap-0 p-0">
          {steps.map((step, index) => {
            const state = resolveStepState(step.id, {
              isCopyTradeLoggedIn,
              isWalletCreated,
              isWalletReady,
              isWalletPending,
              busyDeploy,
              busyBalanceCheck,
              busyLogin,
              busyPoll
            });
            const action = stepActions[step.id];
            const isLast = index === steps.length - 1;
            const actionLabel =
              step.id === "create-wallet"
                ? createActionLabel
                : step.actionLabel;

            return (
              <li key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepIcon state={state} />
                  {!isLast ? (
                    <span
                      className={cn(
                        "my-1 min-h-6 w-px flex-1",
                        state === "done" ? "bg-[#0d69ff]" : "bg-prophet-line"
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          state === "done" || state === "active"
                            ? "text-prophet-ink"
                            : "text-prophet-muted"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs text-prophet-muted">
                        {step.description}
                      </p>
                      {step.id === "deposit" &&
                      isWalletCreated &&
                      !isWalletReady ? (
                        <p className="mt-1 text-xs text-[#3168FF]">
                          {t("deploymentSyncInProgress")}
                        </p>
                      ) : null}
                    </div>

                    {action.visible ? (
                      <StepActionButton
                        label={action.loading ? step.loadingLabel : actionLabel}
                        disabled={action.disabled}
                        loading={action.loading}
                        onClick={action.onClick}
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Modal>
  );
}
