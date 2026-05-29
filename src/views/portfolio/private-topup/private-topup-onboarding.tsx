"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth";
import { PRIVATE_MODE_HOSTNAME } from "@/config/funding";
import { ensureConfidentialAccount } from "@/lib/confidential/client";
import { PrivateTopupGuideDialog } from "@/views/portfolio/private-topup/private-topup-guide-dialog";
import { PrivateTopupIntroDialog } from "@/views/portfolio/private-topup/private-topup-intro-dialog";

export interface PrivateTopupOnboardingProps {
  introOpen: boolean;
  guideOpen: boolean;
  walletAddress: string;
  onIntroOpenChange: (open: boolean) => void;
  onGuideOpenChange: (open: boolean) => void;
}

export function PrivateTopupOnboarding({
  introOpen,
  guideOpen,
  walletAddress,
  onIntroOpenChange,
  onGuideOpenChange,
}: PrivateTopupOnboardingProps) {
  const { disconnect, openLogin } = useAuth();
  const [proceedLoading, setProceedLoading] = useState(false);

  const closeAll = useCallback(() => {
    onGuideOpenChange(false);
    onIntroOpenChange(false);
  }, [onGuideOpenChange, onIntroOpenChange]);

  const handleProceed = useCallback(async () => {
    setProceedLoading(true);

    try {
      await ensureConfidentialAccount(walletAddress);
      closeAll();
      // window.location.href = `https://${PRIVATE_MODE_HOSTNAME}/private`;
    } catch (error) {
      console.log("error: %o", error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Unable to prepare private account.");
    } finally {
      setProceedLoading(false);
    }
  }, [closeAll, walletAddress]);

  const handleChangeWallet = useCallback(async () => {
    try {
      await disconnect();
      await openLogin();
    } catch {
      // Auth provider surfaces errors via context.
    }
  }, [disconnect, openLogin]);

  return (
    <>
      <PrivateTopupIntroDialog
        open={introOpen}
        guideOpen={guideOpen}
        walletAddress={walletAddress}
        proceedLoading={proceedLoading}
        onClose={() => {
          if (!guideOpen) {
            onIntroOpenChange(false);
          }
        }}
        onProceed={() => void handleProceed()}
        onOpenGuide={() => onGuideOpenChange(true)}
        onChangeWallet={() => void handleChangeWallet()}
      />
      <PrivateTopupGuideDialog
        open={guideOpen}
        proceedLoading={proceedLoading}
        onClose={() => onGuideOpenChange(false)}
        onProceed={() => void handleProceed()}
        onChangeWallet={() => void handleChangeWallet()}
      />
    </>
  );
}
