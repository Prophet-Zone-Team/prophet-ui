"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";

import { Modal } from "@/components/ui/modal";
import { OtpInput } from "@/components/auth/otp-input";
import { cn } from "@/lib/cn";
import { markOAuthPending, consumeOAuthPending } from "@/context/privy/privy-oauth";
const RESEND_COUNTDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PrivyLoginModalProps {
  open: boolean;
  onClose: () => void;
  onConnectExtensionWallet: () => void;
  onEmailAuthenticated: () => void;
}

export function PrivyLoginModal({
  open,
  onClose,
  onConnectExtensionWallet,
  onEmailAuthenticated,
}: PrivyLoginModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const emailAuthenticatedRef = useRef(onEmailAuthenticated);

  useEffect(() => {
    emailAuthenticatedRef.current = onEmailAuthenticated;
  }, [onEmailAuthenticated]);

  const { ready } = usePrivy();
  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: () => {
      emailAuthenticatedRef.current();
    },
    onError: (error) => {
      setErrorMessage(resolvePrivyError(error));
    },
  });
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onError: (error) => {
      setErrorMessage(resolvePrivyError(error));
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
      await sendCode({ email: email.trim() });
      setCountdown(RESEND_COUNTDOWN_SECONDS);
    } catch (error) {
      setErrorMessage(resolvePrivyError(error));
    }
  }, [email, sendCode, sendCodeDisabled]);

  const handleVerify = useCallback(async () => {
    if (verifyDisabled) {
      return;
    }

    setErrorMessage(undefined);

    try {
      await loginWithCode({ code });
    } catch (error) {
      setErrorMessage(resolvePrivyError(error));
    }
  }, [code, loginWithCode, verifyDisabled]);

  const handleGoogle = useCallback(async () => {
    setErrorMessage(undefined);

    try {
      markOAuthPending("google");
      await initOAuth({ provider: "google" });
    } catch (error) {
      consumeOAuthPending();
      setErrorMessage(resolvePrivyError(error));
    }
  }, [initOAuth]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Login by Email"
      className="w-full max-w-[468px] rounded-[20px] border border-[#ebebeb] bg-white p-6 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
    >
      <div className="flex flex-col gap-5">
        <h2 className="text-[18px] font-[500] leading-[21px] text-black">
          Login by Email
        </h2>

        <button
          type="button"
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[8px] bg-black text-[14px] font-[500] leading-[18px] text-white disabled:opacity-60"
          disabled={oauthLoading || !ready}
          onClick={() => void handleGoogle()}
        >
          {(oauthLoading || !ready) ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <p className="text-center text-[14px] font-[400] leading-[normal] text-[#909090]">
          Or other email
        </p>

        <div className="relative">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-[50px] w-full rounded-[6px] border border-[#ebebeb] bg-white pl-3 pr-[120px] text-[14px] text-black outline-none placeholder:text-[#909090] focus:border-black"
          />
          <button
            type="button"
            className="absolute right-[4px] top-1/2 flex h-[38px] w-[105px] -translate-y-1/2 items-center justify-center rounded-[6px] bg-black text-[14px] font-[500] leading-[18px] text-white disabled:opacity-30"
            disabled={sendCodeDisabled}
            onClick={() => void handleSendCode()}
          >
            {sendingCode ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : countdown > 0 ? (
              `${countdown}s`
            ) : (
              "Send Code"
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <OtpInput
            value={code}
            length={OTP_LENGTH}
            disabled={!codeSent || submittingCode}
            onChange={setCode}
            onComplete={() => void handleVerify()}
          />
          <button
            type="button"
            className="flex h-[42px] w-[105px] shrink-0 items-center justify-center rounded-[6px] bg-black text-[14px] font-[500] leading-[18px] text-white disabled:opacity-30"
            disabled={verifyDisabled || !ready}
            onClick={() => void handleVerify()}
          >
            {(submittingCode || !ready) ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Verify"
            )}
          </button>
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-prophet-red">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-1 border-t border-[#ebebeb] pt-4",
            "text-[14px] font-[500] leading-[normal] text-black",
          )}
          onClick={onConnectExtensionWallet}
        >
          Connect with extension wallet
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </Modal>
  );
}

function resolvePrivyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong. Please try again.";
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
