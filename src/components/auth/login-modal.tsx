"use client";

import { useEffect, useMemo } from "react";
import { Check, Loader2 } from "lucide-react";

import { PolymarketIcon } from "@/components/icons";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  formatRegionBlockedDetail,
  REGION_BLOCKED_LABEL,
} from "@/lib/trading/trading-eligibility-client";
import type { TradingLoginStep } from "@/lib/trading/trading-login";
import type { AuthContextValue } from "@/context/auth/auth-context";
import { usePathname } from "next/navigation";

interface LoginModalProps {
  auth: Pick<
    AuthContextValue,
    | "hydrated"
    | "loginModalOpen"
    | "loginStep"
    | "loginInProgress"
    | "error"
    | "readiness"
    | "session"
    | "setupSteps"
    | "isAuthenticated"
    | "isRegionBlocked"
    | "eligibilityView"
    | "closeLogin"
    | "connectWallet"
    | "signClobCredentials"
    | "signTokenApprovals"
    | "refreshSession"
    | "refreshSetupReadiness"
  >;
}

const SETUP_STEPS = [
  {
    id: "deploy_wallet",
    label: "Deploy wallet",
    description: "Prepare your Polymarket deposit wallet before signing in.",
  },
  {
    id: "authorize_tokens",
    label: "Authorize tokens",
    description: "Authorize token spending for trading",
  },
  {
    id: "enable_trading",
    label: "Enable trading",
    description: "Sign a message to generate your API key",
  },
] as const;

const POLYGON_HINT =
  "Switch your wallet to Polygon mainnet (chainId 137) before signing.";

export function LoginModal({ auth }: LoginModalProps) {
  const {
    hydrated,
    loginModalOpen,
    loginStep,
    loginInProgress,
    error,
    readiness,
    session,
    setupSteps,
    isAuthenticated,
    isRegionBlocked,
    eligibilityView,
    closeLogin,
    connectWallet,
    signClobCredentials,
    signTokenApprovals,
    refreshSession,
    refreshSetupReadiness,
  } = auth;

  useEffect(() => {
    if (!hydrated || !loginModalOpen || !session) {
      return;
    }

    void refreshSetupReadiness();
  }, [hydrated, loginModalOpen, session, refreshSetupReadiness]);

  const showPolygonHint = Boolean(error) && /chainId|137|polygon/i.test(error ?? "");
  const showRestrictedView = isRegionBlocked && !loginInProgress;

  const pathname = usePathname();
  const isPrivateMode = useMemo(() => {
    return [/^\/private/].some((reg) => reg.test(pathname));
  }, [pathname]);

  return (
    <Modal
      open={hydrated && loginModalOpen && !isPrivateMode}
      onClose={() => void closeLogin()}
      ariaLabel={showRestrictedView ? "Trading unavailable" : "Enable trading"}
      hideCloseButton={loginInProgress}
      className="w-full max-w-md rounded-xl border border-prophet-line bg-white p-6 shadow-prophet"
    >
      <div className="flex flex-col gap-5">
        {showRestrictedView ? (
          <RestrictedRegionView
            detail={formatRegionBlockedDetail(eligibilityView)}
            onClose={() => void closeLogin()}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-extrabold text-prophet-ink">
                Enable trading
              </h2>
              <p className="mt-1 text-sm text-prophet-muted">
                Complete setup with your own wallet. Market data only — not
                financial advice.
              </p>
            </div>

            <ol className="flex flex-col gap-0">
              {SETUP_STEPS.map((step, index) => {
                const state = getSetupStepState(step.id, {
                  session,
                  setupSteps,
                  loginStep,
                  loginInProgress,
                  readiness
                });
                const isLast = index === SETUP_STEPS.length - 1;

                return (
                  <li key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <StepIcon state={state} />
                      {!isLast ? (
                        <span
                          className={cn(
                            "my-1 w-px flex-1 min-h-6",
                            state === "done"
                              ? "bg-[#0d69ff]"
                              : "bg-prophet-line"
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
                                : "text-prophet-muted",
                              state === "failed" && "text-prophet-red"
                            )}
                          >
                            {step.label}
                          </p>
                          <p className="mt-0.5 text-xs text-prophet-muted">
                            {step.id === "deploy_wallet"
                              ? getDeployWalletDescription({
                                  loginStep,
                                  readiness,
                                  session
                                })
                              : step.description}
                          </p>
                        </div>

                        <StepAction
                          stepId={step.id}
                          state={state}
                          setupSteps={setupSteps}
                          loginStep={loginStep}
                          loginInProgress={loginInProgress}
                          session={session}
                          readiness={readiness}
                          onConnectWallet={() => void connectWallet()}
                          onSignClob={() => void signClobCredentials()}
                          onSignTokens={() => void signTokenApprovals()}
                          onRefresh={() => void refreshSession()}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-prophet-red">
                {error}
              </p>
            ) : null}

            {showPolygonHint ? (
              <p className="rounded-lg border border-prophet-line bg-[#fafbfc] px-3 py-2 text-xs text-prophet-muted">
                {POLYGON_HINT}
              </p>
            ) : null}

            {isAuthenticated ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-gradient-to-br from-[#0d69ff] to-[#124cf0] px-4 py-2 text-sm font-extrabold text-white"
                  onClick={() => void closeLogin()}
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>
        )}

        <PoweredByPolymarket />
      </div>
    </Modal>
  );
}

function PoweredByPolymarket() {
  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-prophet-line pt-4">
      <span className="text-xs text-prophet-muted">Powered by</span>
      <PolymarketIcon />
    </div>
  );
}

function RestrictedRegionView({
  detail,
  onClose,
}: {
  detail: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-extrabold text-prophet-ink">
          Trading unavailable in your region
        </h2>
        <p className="mt-1 text-sm text-prophet-muted">
          Market data remains available. Trading and funding actions are disabled.
        </p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-prophet-red">
        <p className="m-0 font-semibold">{REGION_BLOCKED_LABEL}</p>
        <p className="mt-1 m-0 text-prophet-red/90">{detail}</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-lg border border-prophet-line bg-white px-4 py-2 text-sm font-extrabold text-prophet-ink"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

type SetupStepId = (typeof SETUP_STEPS)[number]["id"];
type StepVisualState = "pending" | "active" | "done" | "failed";

function getSetupStepState(
  stepId: SetupStepId,
  context: {
    session: AuthContextValue["session"];
    setupSteps: AuthContextValue["setupSteps"];
    loginStep: TradingLoginStep | undefined;
    loginInProgress: boolean;
    readiness: AuthContextValue["readiness"];
  },
): StepVisualState {
  const { session, setupSteps, loginStep, loginInProgress, readiness } = context;
  const depositStatus = readiness?.session?.depositWalletStatus;

  if (stepId === "deploy_wallet") {
    if (setupSteps.walletDeployed || isDepositWalletStepComplete(loginStep)) {
      return "done";
    }

    if (
      loginInProgress &&
      (loginStep === "requesting_wallet" ||
        loginStep === "checking_wallet_deployment" ||
        loginStep === "deploying_wallet")
    ) {
      return "active";
    }

    if (depositStatus === "error") {
      return "failed";
    }

    if (session && (depositStatus === "deploying" || depositStatus === "derived")) {
      return "active";
    }

    return session ? "active" : "pending";
  }

  if (stepId === "authorize_tokens") {
    if (setupSteps.tokensAuthorized || loginStep === "tokens_already_authorized") {
      return "done";
    }

    if (
      loginInProgress &&
      (loginStep === "checking_token_approval" ||
        loginStep === "awaiting_token_approval_signature" ||
        loginStep === "submitting_token_approval")
    ) {
      return "active";
    }

    return setupSteps.walletDeployed ? "pending" : "pending";
  }

  if (stepId === "enable_trading") {
    if (setupSteps.clobSigned || loginStep === "clob_already_derived") {
      return "done";
    }

    if (
      loginInProgress &&
      (loginStep === "checking_clob_credentials" ||
        loginStep === "checking_trading_chain" ||
        loginStep === "switching_trading_chain" ||
        loginStep === "awaiting_clob_signature" ||
        loginStep === "deriving_credentials")
    ) {
      return "active";
    }

    return setupSteps.walletDeployed ? "pending" : "pending";
  }

  return "pending";
}

function StepAction({
  stepId,
  state,
  setupSteps,
  loginStep,
  loginInProgress,
  session,
  readiness,
  onConnectWallet,
  onSignClob,
  onSignTokens,
  onRefresh,
}: {
  stepId: SetupStepId;
  state: StepVisualState;
  setupSteps: AuthContextValue["setupSteps"];
  loginStep: TradingLoginStep | undefined;
  loginInProgress: boolean;
  session: AuthContextValue["session"];
  readiness: AuthContextValue["readiness"];
  onConnectWallet: () => void;
  onSignClob: () => void;
  onSignTokens: () => void;
  onRefresh: () => void;
}) {
  const showLoading =
    loginInProgress && isCurrentStepLoading(stepId, state, loginStep, setupSteps);

  if (state === "done") {
    if (stepId === "deploy_wallet" && !setupSteps.walletDeployed && isDepositWalletStepComplete(loginStep)) {
      return (
        <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Already deployed</span>
      );
    }

    if (stepId === "authorize_tokens" && loginStep === "tokens_already_authorized") {
      return (
        <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Already authorized</span>
      );
    }

    if (stepId === "enable_trading" && loginStep === "clob_already_derived") {
      return (
        <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Already enabled</span>
      );
    }

    return (
      <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Done</span>
    );
  }

  if (showLoading) {
    return (
      <StepLoadingLabel
        label={getLoadingLabel(stepId, loginStep, state, {
          session,
          readiness,
        })}
      />
    );
  }

  if (stepId === "deploy_wallet") {
    if (state === "failed") {
      return (
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-[#0d69ff] disabled:opacity-60"
          disabled={loginInProgress}
          onClick={onRefresh}
        >
          Retry
        </button>
      );
    }

    if (setupSteps.walletDeployed) {
      return (
        <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Done</span>
      );
    }

    if (loginStep === "wallet_already_deployed") {
      return (
        <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Already deployed</span>
      );
    }

    if (state === "active") {
      return (
        <StepLoadingLabel
          label={getLoadingLabel(stepId, loginStep, state, {
            session,
            readiness,
          })}
        />
      );
    }

    return (
      <button
        type="button"
        className="shrink-0 rounded-lg bg-gradient-to-br from-[#0d69ff] to-[#124cf0] px-3 py-1.5 text-sm font-extrabold text-white disabled:opacity-60"
        disabled={loginInProgress}
        onClick={onConnectWallet}
      >
        Connect wallet
      </button>
    );
  }

  if (stepId === "authorize_tokens") {
    if (loginStep === "tokens_already_authorized") {
      return (
        <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Already authorized</span>
      );
    }

    return (
      <button
        type="button"
        className="shrink-0 rounded-lg bg-gradient-to-br from-[#0d69ff] to-[#124cf0] px-3 py-1.5 text-sm font-extrabold text-white disabled:opacity-60"
        disabled={loginInProgress || !setupSteps.walletDeployed || setupSteps.tokensAuthorized}
        onClick={onSignTokens}
      >
        Sign
      </button>
    );
  }

  if (loginStep === "clob_already_derived") {
    return (
      <span className="shrink-0 text-sm font-semibold text-[#0d69ff]">Already enabled</span>
    );
  }

  return (
    <button
      type="button"
      className="shrink-0 rounded-lg bg-gradient-to-br from-[#0d69ff] to-[#124cf0] px-3 py-1.5 text-sm font-extrabold text-white disabled:opacity-60"
      disabled={loginInProgress || !setupSteps.walletDeployed || setupSteps.clobSigned}
      onClick={onSignClob}
    >
      Sign
    </button>
  );
}

function StepLoadingLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-prophet-muted">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

function getLoadingLabel(
  stepId: SetupStepId,
  loginStep: TradingLoginStep | undefined,
  state: StepVisualState,
  context?: {
    session: AuthContextValue["session"];
    readiness: AuthContextValue["readiness"];
  },
) {
  if (stepId === "deploy_wallet") {
    if (state === "failed") {
      return "Retrying…";
    }

    if (loginStep === "requesting_wallet") {
      return "Connecting…";
    }

    if (loginStep === "checking_wallet_deployment") {
      return "Checking deposit wallet…";
    }

    if (loginStep === "wallet_already_deployed") {
      return "Already deployed";
    }

    if (loginStep === "deploying_wallet") {
      return "Deploying deposit wallet…";
    }

    if (loginStep === "awaiting_session_signature") {
      return "Awaiting signature…";
    }

    if (loginStep === "creating_session") {
      return "Creating session…";
    }

    if (loginStep === "verifying_readiness") {
      return "Verifying readiness…";
    }

    if (context?.readiness?.session?.depositWalletStatus === "deploying") {
      return "Deploying deposit wallet…";
    }

    return "Checking deposit wallet…";
  }

  if (stepId === "authorize_tokens") {
    if (loginStep === "checking_token_approval") {
      return "Checking token approval…";
    }

    if (loginStep === "tokens_already_authorized") {
      return "Already authorized";
    }

    if (loginStep === "submitting_token_approval") {
      return "Submitting approval…";
    }

    return "Awaiting signature…";
  }

  if (stepId === "enable_trading") {
    if (loginStep === "checking_clob_credentials") {
      return "Checking credentials…";
    }

    if (loginStep === "checking_trading_chain") {
      return "Checking network…";
    }

    if (loginStep === "switching_trading_chain") {
      return "Switching to Polygon…";
    }

    if (loginStep === "clob_already_derived") {
      return "Already enabled";
    }

    if (loginStep === "deriving_credentials") {
      return "Deriving credentials…";
    }

    return "Awaiting signature…";
  }

  return "Awaiting signature…";
}

function isCurrentStepLoading(
  stepId: SetupStepId,
  state: StepVisualState,
  loginStep: TradingLoginStep | undefined,
  setupSteps: AuthContextValue["setupSteps"],
) {
  if (stepId === "deploy_wallet") {
    if (
      loginStep === "requesting_wallet" ||
      loginStep === "checking_wallet_deployment" ||
      loginStep === "deploying_wallet"
    ) {
      return true;
    }

    if (state === "failed") {
      return true;
    }

    return state === "active" && !setupSteps.walletDeployed && !isDepositWalletStepComplete(loginStep);
  }

  if (stepId === "authorize_tokens") {
    return (
      loginStep === "checking_token_approval" ||
      loginStep === "awaiting_token_approval_signature" ||
      loginStep === "submitting_token_approval"
    );
  }

  if (stepId === "enable_trading") {
    return (
      loginStep === "checking_clob_credentials" ||
      loginStep === "checking_trading_chain" ||
      loginStep === "switching_trading_chain" ||
      loginStep === "awaiting_clob_signature" ||
      loginStep === "deriving_credentials"
    );
  }

  return false;
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
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0d69ff] text-white">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }

  if (state === "failed") {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-prophet-red text-xs font-bold text-prophet-red">
        !
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-prophet-line bg-white" />
  );
}

function isDepositWalletStepComplete(loginStep: TradingLoginStep | undefined) {
  return (
    loginStep === "wallet_already_deployed" ||
    loginStep === "awaiting_session_signature" ||
    loginStep === "creating_session" ||
    loginStep === "verifying_readiness" ||
    loginStep === "checking_clob_credentials" ||
    loginStep === "checking_trading_chain" ||
    loginStep === "switching_trading_chain" ||
    loginStep === "clob_already_derived" ||
    loginStep === "awaiting_clob_signature" ||
    loginStep === "deriving_credentials" ||
    loginStep === "checking_token_approval" ||
    loginStep === "tokens_already_authorized" ||
    loginStep === "awaiting_token_approval_signature" ||
    loginStep === "submitting_token_approval"
  );
}

function getDeployWalletDescription({
  loginStep,
  readiness,
  session,
}: {
  loginStep: TradingLoginStep | undefined;
  readiness: AuthContextValue["readiness"];
  session: AuthContextValue["session"];
}) {
  const funderAddress = readiness?.session?.funderAddress ?? session?.funderAddress;
  const shortFunder = funderAddress ? `${funderAddress.slice(0, 6)}…${funderAddress.slice(-4)}` : undefined;

  if (loginStep === "checking_wallet_deployment") {
    return "Checking whether your Polymarket deposit wallet is already deployed.";
  }

  if (loginStep === "wallet_already_deployed" || readiness?.session?.depositWalletStatus === "deployed") {
    return shortFunder
      ? `Deposit wallet already deployed at ${shortFunder}.`
      : "Your Polymarket deposit wallet is already deployed.";
  }

  if (loginStep === "deploying_wallet" || readiness?.session?.depositWalletStatus === "deploying") {
    return "Deploying your Polymarket deposit wallet.";
  }

  return "Prepare your Polymarket deposit wallet before signing in.";
}
