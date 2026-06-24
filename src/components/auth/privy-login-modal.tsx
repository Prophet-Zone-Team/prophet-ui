"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Loader2, X } from "lucide-react";
import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";

import { useTranslations } from "next-intl";

import { OtpInput } from "@/components/auth/otp-input";
import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { trackLoginClicked } from "@/lib/analytics/tracking";
import { checkEligibilityWhitelistEmail } from "@/lib/trading/trading-eligibility-client";
import { markOAuthPending, consumeOAuthPending } from "@/context/privy/privy-oauth";
import { resolvePrivyLoginEmail } from "@/context/privy/resolve-privy-login-email";
const RESEND_COUNTDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const modalShellClass = cn(
  "relative w-full bg-white",
  "p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
  "sm:max-w-[468px] sm:rounded-[20px] sm:border sm:border-[#ebebeb] sm:p-6 sm:pb-6",
  "sm:shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
);

interface PrivyLoginModalProps {
  open: boolean;
  onClose: () => void;
  emailOnlyMode?: boolean;
  requireWhitelistEmail?: boolean;
  onConnectExtensionWallet: () => void;
  onEmailAuthenticated: (email: string) => void;
}

export function PrivyLoginModal({
  open,
  onClose,
  emailOnlyMode = false,
  requireWhitelistEmail = false,
  onConnectExtensionWallet,
  onEmailAuthenticated,
}: PrivyLoginModalProps) {
  const t = useTranslations("auth");
  const isMobile = useDevice();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const emailAuthenticatedRef = useRef(onEmailAuthenticated);
  const emailLoginHandledRef = useRef(false);

  useEffect(() => {
    emailAuthenticatedRef.current = onEmailAuthenticated;
  }, [onEmailAuthenticated]);

  const handleEmailAuthenticated = useCallback((resolvedEmail: string) => {
    if (emailLoginHandledRef.current) {
      return;
    }

    emailLoginHandledRef.current = true;
    emailAuthenticatedRef.current(resolvedEmail);
  }, []);

  const { ready } = usePrivy();
  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: (params) => {
      if (params.wasAlreadyAuthenticated) {
        return;
      }

      const resolvedEmail =
        resolvePrivyLoginEmail(params.user, params.loginAccount) ??
        email.trim();

      if (resolvedEmail) {
        handleEmailAuthenticated(resolvedEmail);
      }
    },
    onError: (error) => {
      setErrorMessage(resolvePrivyError(error, t("somethingWentWrongPleaseRetry")));
    },
  });
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onError: (error) => {
      setErrorMessage(resolvePrivyError(error, t("somethingWentWrongPleaseRetry")));
    },
  });

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (!open) {
      setCode("");
      setCountdown(0);
      setErrorMessage(undefined);
      emailLoginHandledRef.current = false;
    }
  }, [open]);

  const emailValid = useMemo(() => EMAIL_PATTERN.test(email.trim()), [email]);
  const sendingCode = state.status === "sending-code";
  const submittingCode = state.status === "submitting-code";
  const codeSent =
    state.status === "awaiting-code-input" ||
    state.status === "submitting-code";

  const sendCodeDisabled =
    !emailValid || sendingCode || submittingCode || countdown > 0;
  const verifyDisabled = code.length < OTP_LENGTH || submittingCode;

  const handleSendCode = useCallback(async () => {
    if (sendCodeDisabled) {
      return;
    }

    setErrorMessage(undefined);

    try {
      if (requireWhitelistEmail) {
        const whitelistCheck = await checkEligibilityWhitelistEmail(email.trim());

        if (!whitelistCheck.allowed) {
          setErrorMessage(t("whitelistRequired"));
          return;
        }
      }

      await sendCode({ email: email.trim() });
      setCountdown(RESEND_COUNTDOWN_SECONDS);
    } catch (error) {
      setErrorMessage(resolvePrivyError(error, t("somethingWentWrongPleaseRetry")));
    }
  }, [email, requireWhitelistEmail, sendCode, sendCodeDisabled, t]);

  const handleVerify = useCallback(async () => {
    if (verifyDisabled) {
      return;
    }

    setErrorMessage(undefined);

    try {
      await loginWithCode({ code });

      // Returning Privy users may already be authenticated, so onComplete
      // does not fire again after OTP verification.
      const resolvedEmail = email.trim();

      if (resolvedEmail) {
        handleEmailAuthenticated(resolvedEmail);
      }
    } catch (error) {
      setErrorMessage(resolvePrivyError(error, t("somethingWentWrongPleaseRetry")));
    }
  }, [code, email, handleEmailAuthenticated, loginWithCode, t, verifyDisabled]);

  const handleGoogle = useCallback(async () => {
    setErrorMessage(undefined);

    try {
      markOAuthPending("google");
      await initOAuth({ provider: "google" });
    } catch (error) {
      consumeOAuthPending();
      setErrorMessage(resolvePrivyError(error, t("somethingWentWrongPleaseRetry")));
    }
  }, [initOAuth, t]);

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("loginByEmail")}
      overlayClassName="z-[70]"
      closeButtonClassName="border-0"
    >
      <div className={modalShellClass}>
        {isMobile ? (
          <button
            type="button"
            className="absolute right-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg bg-white text-[#18110F] transition-colors hover:bg-[#fafbfc]"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <div className="flex flex-col gap-5">
          <h2 className="pr-8 text-[18px] font-[500] leading-[21px] text-black sm:pr-0">
            {t("loginByEmail")}
          </h2>

          {!emailOnlyMode ? (
            <button
              type="button"
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[8px] bg-black text-[14px] font-[500] leading-[18px] text-white disabled:opacity-60"
              disabled={oauthLoading || !ready}
              onClick={() => void handleGoogle()}
            >
              {oauthLoading || !ready ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <GoogleIcon />
              )}
              {t("continueWithGoogle")}
            </button>
          ) : null}

          {!emailOnlyMode ? (
            <p className="text-center text-[14px] font-[400] leading-[normal] text-[#909090]">
              {t("orOtherEmail")}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:relative">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("emailAddress")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[50px] w-full rounded-[6px] border border-[#ebebeb] bg-white pl-3 pr-3 text-[16px] text-black outline-none placeholder:text-[#909090] focus:border-black sm:pr-[120px] sm:text-[14px]"
            />
            <button
              type="button"
              className={cn(
                "flex h-[50px] w-full items-center justify-center rounded-[6px] bg-black text-[14px] font-[500] leading-[18px] text-white disabled:opacity-30",
                "sm:absolute sm:right-[4px] sm:top-1/2 sm:h-[38px] sm:w-[105px] sm:-translate-y-1/2"
              )}
              disabled={sendCodeDisabled}
              onClick={() => void handleSendCode()}
            >
              {sendingCode ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : countdown > 0 ? (
                t("resendCountdown", { count: countdown })
              ) : (
                t("sendCode")
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <OtpInput
              value={code}
              length={OTP_LENGTH}
              disabled={submittingCode}
              onChange={setCode}
              onComplete={() => void handleVerify()}
            />
            <button
              type="button"
              className="flex h-[42px] w-full shrink-0 items-center justify-center rounded-[6px] bg-black text-[14px] font-[500] leading-[18px] text-white disabled:opacity-30 sm:w-[105px]"
              disabled={verifyDisabled || !ready}
              onClick={() => void handleVerify()}
            >
              {submittingCode || !ready ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                t("verify")
              )}
            </button>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-prophet-red">
              {errorMessage}
            </p>
          ) : null}

          {!emailOnlyMode ? (
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-1 border-t border-[#ebebeb] pt-4",
                "text-[14px] font-[500] leading-[normal] text-black"
              )}
              onClick={() => {
                trackLoginClicked({
                  entrySource: "privy_login_modal",
                  label: "Connect with extension wallet"
                });
                onConnectExtensionWallet();
              }}
            >
              {t("connectWithExtensionWallet")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}

function resolvePrivyError(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallbackMessage;
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
