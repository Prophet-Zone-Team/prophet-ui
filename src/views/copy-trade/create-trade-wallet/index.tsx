"use client";

import { Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { getCopyTradeBalances } from "@/service/copy-trade";
import {
  selectCopyTradeSession,
  useCopyTradeStore
} from "@/store/copy-trade-store";

import { useCopyTradeTest } from "../use-copy-trade-test";

const STEPS = [
  {
    id: "sign-in",
    title: "Sign up / Sign in",
    description:
      "A platform account and independent copy-trading identity will be generated for you.",
    actionLabel: "Sign",
    loadingLabel: "Signing…"
  },
  {
    id: "create-wallet",
    title: "Create CopyTrading Wallet",
    description:
      "Generate your exclusive on-chain copy-trade wallet for fund custody and order placement.",
    actionLabel: "Create",
    continueLabel: "Continue",
    refreshLabel: "Refresh",
    loadingLabel: "Creating…"
  },
  {
    id: "deposit",
    title: "Deposit / Transfer",
    description:
      "Deposit USDC from your browser wallet or exchange; it will be automatically cross-chain wrapped into pUSD.",
    actionLabel: "Deposit",
    loadingLabel: "Checking…"
  }
] as const;

type StepId = (typeof STEPS)[number]["id"];
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
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-prophet-line bg-white" />
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
        "inline-flex h-10 w-[100px] shrink-0 items-center justify-center rounded-[8px]",
        "bg-black text-sm font-medium leading-[18px] text-white transition-opacity",
        "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
      return STEPS[1].actionLabel;
    }

    if (isWalletPending && !isWalletReady) {
      return STEPS[1].continueLabel;
    }

    return STEPS[1].refreshLabel;
  }, [copyWallet, isWalletPending, isWalletReady]);

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
      ariaLabel="Create CopyTrade Wallet"
      className={cn(
        "w-full max-w-[556px] rounded-[20px] border border-[#EBEBEB] bg-white",
        "p-5 shadow-[0px_0px_10px_rgba(0,0,0,0.1)] sm:p-5"
      )}
      closeButtonClassName="right-5 top-5 border-0 bg-transparent text-[#909090] hover:bg-transparent hover:text-black"
    >
      <div className="flex flex-col gap-5 pr-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-lg font-medium leading-[23px] text-black">
            Create CopyTrade Wallet
          </h2>
          <p className="text-sm font-normal leading-[18px] text-[#909090]">
            Complete identity verification, create copy-trade wallet and deposit
            funds to enable real-time copy trading.
          </p>
        </header>

        <ol className="m-0 flex list-none flex-col gap-0 p-0">
          {STEPS.map((step, index) => {
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
            const isLast = index === STEPS.length - 1;
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
                          Wallet deployment or approval sync is still in
                          progress.
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
