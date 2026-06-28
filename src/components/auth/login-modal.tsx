"use client";

import { useEffect, useMemo } from "react";
import { Check, Loader2 } from "lucide-react";

import { ChevronRight } from "lucide-react";

import { PolymarketIcon } from "@/components/icons";
import { Modal } from "@/components/ui/modal";
import { PrivyLoginModal } from "@/components/auth/privy-login-modal";
import { cn } from "@/lib/cn";
import { trackLoginClicked } from "@/lib/analytics/tracking";
import {
  formatCloseOnlyDetail,
  formatCloseOnlyLabel,
  formatRegionBlockedDetail,
  formatRegionBlockedLabel,
} from "@/lib/trading/trading-eligibility-client";
import type { TradingLoginStep } from "@/lib/trading/trading-login";
import type { AuthContextValue } from "@/context/auth/auth-context";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getStableflowChainLogo } from "@/utils/logo";

interface LoginModalProps {
  auth: Pick<
    AuthContextValue,
    | "hydrated"
    | "loginModalOpen"
    | "loginStep"
    | "loginInProgress"
    | "privyLoginInProgress"
    | "error"
    | "readiness"
    | "session"
    | "setupSteps"
    | "isAuthenticated"
    | "isRegionBlocked"
    | "isRegionCloseOnly"
    | "whitelistLoginMode"
    | "emailOnlyLogin"
    | "eligibilityView"
    | "privyModalOpen"
    | "closeLogin"
    | "openLogin"
    | "connectNearWallet"
    | "openPrivyLogin"
    | "closePrivyLogin"
    | "completePrivyEmailLogin"
    | "setLoginMethod"
    | "signClobCredentials"
    | "signTokenApprovals"
    | "refreshSession"
    | "refreshSetupReadiness"
  >;
}

const SETUP_STEPS = [
  {
    id: "deploy_wallet",
    labelKey: "connectWallet",
    descriptionKey: "connectWalletDescription"
  },
  {
    id: "authorize_tokens",
    labelKey: "approveUsdc",
    descriptionKey: "approveUsdcDescription"
  },
  {
    id: "enable_trading",
    labelKey: "enableOrders",
    descriptionKey: "enableOrdersDescription"
  }
] as const;

export function LoginModal({ auth }: LoginModalProps) {
  const t = useTranslations("auth");
  const {
    hydrated,
    loginModalOpen,
    loginStep,
    loginInProgress,
    privyLoginInProgress,
    error,
    readiness,
    session,
    setupSteps,
    isAuthenticated,
    isRegionBlocked,
    isRegionCloseOnly,
    whitelistLoginMode,
    emailOnlyLogin,
    eligibilityView,
    privyModalOpen,
    closeLogin,
    openLogin,
    connectNearWallet,
    openPrivyLogin,
    closePrivyLogin,
    completePrivyEmailLogin,
    setLoginMethod,
    signClobCredentials,
    signTokenApprovals,
    refreshSession,
    refreshSetupReadiness
  } = auth;

  useEffect(() => {
    if (!hydrated || !loginModalOpen || !session) {
      return;
    }

    void refreshSetupReadiness();
  }, [hydrated, loginModalOpen, session, refreshSetupReadiness]);

  const showPolygonHint = Boolean(error) && /chainId|137|polygon/i.test(error ?? "");
  const showRestrictedView =
    isRegionBlocked && !whitelistLoginMode && !loginInProgress;
  const showCloseOnlyBanner = isRegionCloseOnly && !showRestrictedView && !loginInProgress;

  const pathname = usePathname();
  const isPrivateMode = useMemo(() => {
    return [/^\/private/].some((reg) => reg.test(pathname));
  }, [pathname]);

  const loginModalVisible =
    hydrated && loginModalOpen && !isPrivateMode && !privyModalOpen;
  const preventAutoDismiss = !isAuthenticated && !showRestrictedView;

  return (
    <>
      <Modal
        open={loginModalVisible}
        onClose={() => void closeLogin()}
        ariaLabel={
          showRestrictedView ? t("tradingUnavailable") : t("enableTrading")
        }
        hideCloseButton={false}
        overlayCloseable={!preventAutoDismiss}
        escapeCloseable={!preventAutoDismiss}
        className="w-full max-w-md rounded-xl border border-prophet-line bg-white p-6 shadow-prophet"
      >
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-[18px] font-[500] leading-[21px] text-black">
              {t("welcomeTitle")}
            </h2>
            <div className="text-[14px] font-[400] leading-[21px] text-[#909090] mt-2">
              {t.rich("welcomeDescription", {
                brand: (chunks) => (
                  <span className="text-black font-[500]">{chunks}</span>
                )
              })}
            </div>
            <p className="mt-2 text-[12px] font-[400] text-[#3168FF] px-[10px] py-[4px] rounded-[8px] bg-[#E3E9FF]">
              {t("disclaimer")}
            </p>
          </div>
          {showCloseOnlyBanner ? (
            <p className="text-[12px] font-[400] text-[#3168FF] px-[10px] py-[4px] rounded-[8px] bg-[#E3E9FF]">
              {formatCloseOnlyLabel(eligibilityView)}:{" "}
              {formatCloseOnlyDetail(eligibilityView)}
            </p>
          ) : null}
          {emailOnlyLogin && !showRestrictedView ? (
            <p className="text-[12px] font-[400] text-[#3168FF] px-[10px] py-[4px] rounded-[8px] bg-[#E3E9FF]">
              {t("whitelistEmailLoginHint")}
            </p>
          ) : null}
          {showRestrictedView ? (
            <RestrictedRegionView
              detail={formatRegionBlockedDetail(eligibilityView)}
              label={formatRegionBlockedLabel(eligibilityView)}
              onClose={() => void closeLogin()}
            />
          ) : (
            <>
              <ol className="flex flex-col gap-0">
                {SETUP_STEPS.map((step, index) => {
                  const state = getSetupStepState(step.id, {
                    session,
                    setupSteps,
                    loginStep,
                    loginInProgress,
                    privyLoginInProgress,
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
                        <div
                          className={cn(
                            "flex items-start justify-between gap-3",
                            index === 0 && "flex-wrap"
                          )}
                        >
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
                              {t(step.labelKey)}
                            </p>
                            <p className="mt-0.5 text-xs text-prophet-muted">
                              {step.id === "deploy_wallet"
                                ? getDeployWalletDescription({
                                    loginStep,
                                    readiness,
                                    session,
                                    t
                                  })
                                : t(step.descriptionKey)}
                            </p>
                          </div>

                          {stepNeedsUserAction(step.id, {
                            state,
                            setupSteps,
                            loginStep,
                            loginInProgress,
                            privyLoginInProgress,
                            session,
                            emailOnlyConnect:
                              emailOnlyLogin && step.id === "deploy_wallet"
                          }) ? (
                            <StepAction
                              stepId={step.id}
                              state={state}
                              loginInProgress={loginInProgress}
                              privyLoginInProgress={privyLoginInProgress}
                              emailOnlyConnect={
                                emailOnlyLogin && step.id === "deploy_wallet"
                              }
                              onConnectWallet={() => {
                                trackLoginClicked({
                                  entrySource: "login_modal_setup",
                                  label: "Connect wallet"
                                });
                                void openLogin("wallet");
                              }}
                              onConnectEmail={() => {
                                trackLoginClicked({
                                  entrySource: "login_modal_setup",
                                  label: "Login by email"
                                });
                                openPrivyLogin();
                              }}
                              onConnectNear={() => {
                                trackLoginClicked({
                                  entrySource: "login_modal_setup",
                                  label: "Connect Near wallet"
                                });
                                void connectNearWallet();
                              }}
                              onSignClob={() => void signClobCredentials()}
                              onSignTokens={() => void signTokenApprovals()}
                              onRefresh={() => void refreshSession()}
                            />
                          ) : null}
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
                  {t("polygonHint")}
                </p>
              ) : null}

              {isAuthenticated ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-lg bg-gradient-to-br from-[#0d69ff] to-[#124cf0] px-4 py-2 text-sm font-extrabold text-white"
                    onClick={() => void closeLogin()}
                  >
                    {t("done")}
                  </button>
                </div>
              ) : null}

              {!isAuthenticated && !emailOnlyLogin ? (
                <button
                  type="button"
                  className="flex items-center justify-center gap-1 border-t border-prophet-line pt-4 text-[14px] font-[500] leading-[normal] text-black disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={openPrivyLogin}
                  disabled={loginInProgress || privyLoginInProgress}
                >
                  {t("orLoginByEmail")}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </>
          )}
        </div>
      </Modal>

      <PrivyLoginModal
        open={privyModalOpen}
        onClose={closePrivyLogin}
        emailOnlyMode={emailOnlyLogin}
        requireWhitelistEmail={whitelistLoginMode}
        onConnectExtensionWallet={() => {
          trackLoginClicked({
            entrySource: "privy_login_modal",
            label: "Connect with extension wallet"
          });
          setLoginMethod("wallet");
          closePrivyLogin();
          void openLogin();
        }}
        onEmailAuthenticated={completePrivyEmailLogin}
      />
    </>
  );
}


function RestrictedRegionView({
  detail,
  label,
  onClose,
}: {
  detail: string;
  label: string;
  onClose: () => void;
}) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-extrabold text-prophet-ink">
          {t("tradingUnavailableInRegion")}
        </h2>
        <p className="mt-1 text-sm text-prophet-muted">
          {t("regionMarketDataAvailable")}
        </p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-prophet-red">
        <p className="m-0 font-semibold">{label}</p>
        <p className="mt-1 m-0 text-prophet-red/90">{detail}</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-lg border border-prophet-line bg-white px-4 py-2 text-sm font-extrabold text-prophet-ink"
          onClick={onClose}
        >
          {tCommon("close")}
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
    privyLoginInProgress: boolean;
    readiness: AuthContextValue["readiness"];
  },
): StepVisualState {
  const {
    session,
    setupSteps,
    loginStep,
    loginInProgress,
    privyLoginInProgress,
    readiness,
  } = context;
  const depositStatus = readiness?.session?.depositWalletStatus;

  if (stepId === "deploy_wallet") {
    if (setupSteps.walletDeployed || isDepositWalletStepComplete(loginStep)) {
      return "done";
    }

    if (
      privyLoginInProgress || (loginInProgress &&
        (loginStep === "requesting_wallet" ||
          loginStep === "checking_wallet_deployment" ||
          loginStep === "deploying_wallet" ||
          loginStep === "creating_session" ||
          loginStep === "verifying_readiness" ||
          loginStep === "awaiting_session_signature"
        ))
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
      (loginInProgress || privyLoginInProgress) &&
      (loginStep === "checking_token_approval" ||
        loginStep === "awaiting_token_approval_signature" ||
        loginStep === "submitting_token_approval" ||
        loginStep === "awaiting_session_signature" ||
        loginStep === "creating_session" ||
        loginStep === "verifying_readiness"
      )
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
      (loginInProgress || privyLoginInProgress) &&
      (loginStep === "checking_clob_credentials" ||
        loginStep === "checking_trading_chain" ||
        loginStep === "switching_trading_chain" ||
        loginStep === "awaiting_clob_signature" ||
        loginStep === "deriving_credentials"
      )
    ) {
      return "active";
    }

    return setupSteps.walletDeployed ? "pending" : "pending";
  }

  return "pending";
}

function stepNeedsUserAction(
  stepId: SetupStepId,
  context: {
    state: StepVisualState;
    setupSteps: AuthContextValue["setupSteps"];
    loginStep: TradingLoginStep | undefined;
    loginInProgress: boolean;
    privyLoginInProgress: boolean;
    session: AuthContextValue["session"];
    emailOnlyConnect?: boolean;
  }
): boolean {
  const {
    state,
    setupSteps,
    loginStep,
    loginInProgress,
    privyLoginInProgress,
    session,
    emailOnlyConnect
  } = context;

  if (stepId === "deploy_wallet") {
    if (state === "failed") {
      return !loginInProgress && !privyLoginInProgress;
    }

    if (emailOnlyConnect) {
      return state !== "done";
    }

    return !session && !loginInProgress && !privyLoginInProgress;
  }

  if (!session || session.depositWalletStatus !== "deployed") {
    return false;
  }

  if (stepId === "authorize_tokens") {
    if (
      setupSteps.tokensAuthorized ||
      loginStep === "tokens_already_authorized"
    ) {
      return false;
    }

    return (
      setupSteps.walletDeployed && !loginInProgress && !privyLoginInProgress
    );
  }

  if (setupSteps.clobSigned || loginStep === "clob_already_derived") {
    return false;
  }

  return setupSteps.walletDeployed && !loginInProgress && !privyLoginInProgress;
}

function StepAction({
  stepId,
  state,
  loginInProgress,
  privyLoginInProgress = false,
  emailOnlyConnect = false,
  onConnectWallet,
  onConnectEmail,
  onConnectNear,
  onSignClob,
  onSignTokens,
  onRefresh
}: {
  stepId: SetupStepId;
  state: StepVisualState;
  loginInProgress: boolean;
  privyLoginInProgress?: boolean;
  emailOnlyConnect?: boolean;
  onConnectWallet: () => void;
  onConnectEmail: () => void;
  onConnectNear: () => void;
  onSignClob: () => void;
  onSignTokens: () => void;
  onRefresh: () => void;
}) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  if (stepId === "deploy_wallet") {
    if (state === "failed") {
      return (
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-[#0d69ff] disabled:opacity-60"
          disabled={loginInProgress || privyLoginInProgress}
          onClick={onRefresh}
        >
          {t("retry")}
        </button>
      );
    }

    if (emailOnlyConnect) {
      const isEmailConnectLoading =
        loginInProgress || privyLoginInProgress || state === "active";

      return (
        <button
          type="button"
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[8px] bg-black text-[14px] font-[500] leading-[18px] text-white disabled:opacity-60"
          disabled={isEmailConnectLoading}
          onClick={onConnectEmail}
        >
          {isEmailConnectLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {tCommon("loading")}
            </>
          ) : (
            t("loginByEmail")
          )}
        </button>
      );
    }

    return (
      <div className="w-full grid grid-cols-2 border border-[#EBEBEB] rounded-[12px] p-[3px]">
        <button
          type="button"
          className="flex justify-center items-center gap-2 shrink-0 rounded-[8px] w-full h-[50px] text-[14px] font-[500] leading-[18px] text-white bg-black disabled:opacity-60 duration-150"
          disabled={loginInProgress}
          onClick={onConnectWallet}
        >
          {t("connectEVMWallet")}
        </button>
        <button
          type="button"
          className="flex justify-center items-center gap-2 shrink-0 rounded-[8px] w-full h-[50px] text-[14px] font-[500] leading-[18px] text-black disabled:opacity-60 duration-150"
          disabled={loginInProgress}
          onClick={onConnectNear}
        >
          {t("connectNearWallet")}
        </button>
      </div>
    );
  }

  if (stepId === "authorize_tokens") {
    return (
      <button
        type="button"
        className="shrink-0 rounded-[8px] bg-black w-[100px] h-[40px] text-[14px] font-[500] leading-[18px] text-white disabled:opacity-60"
        disabled={loginInProgress}
        onClick={onSignTokens}
      >
        {t("sign")}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="shrink-0 rounded-[8px] bg-black w-[100px] h-[40px] text-[14px] font-[500] leading-[18px] text-white disabled:opacity-60"
      disabled={loginInProgress}
      onClick={onSignClob}
    >
      {t("sign")}
    </button>
  );
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
  t,
}: {
  loginStep: TradingLoginStep | undefined;
  readiness: AuthContextValue["readiness"];
  session: AuthContextValue["session"];
  t: ReturnType<typeof useTranslations<"auth">>;
}) {
  const funderAddress = readiness?.session?.funderAddress ?? session?.funderAddress;
  const shortFunder = funderAddress ? `${funderAddress.slice(0, 6)}…${funderAddress.slice(-4)}` : undefined;

  if (loginStep === "checking_wallet_deployment") {
    return t("checkingDepositWalletDeployment");
  }

  if (loginStep === "wallet_already_deployed" || readiness?.session?.depositWalletStatus === "deployed") {
    return shortFunder
      ? t("depositWalletDeployedAt", { address: shortFunder })
      : t("depositWalletAlreadyDeployed");
  }

  if (loginStep === "deploying_wallet" || readiness?.session?.depositWalletStatus === "deploying") {
    return t("deployingDepositWallet");
  }

  return t("prepareDepositWallet");
}
