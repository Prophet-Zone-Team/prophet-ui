"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useAuth } from "@/context/auth";
import { PrivateTopupGuideDialog } from "@/views/portfolio/private-topup/private-topup-guide-dialog";
import { PrivateTopupIntroDialog } from "@/views/portfolio/private-topup/private-topup-intro-dialog";
import { PRIVATE_MODE_HOSTNAME } from "@/config/funding";

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
  const router = useRouter();
  const { disconnect, openLogin } = useAuth();

  const closeAll = useCallback(() => {
    onGuideOpenChange(false);
    onIntroOpenChange(false);
  }, [onGuideOpenChange, onIntroOpenChange]);

  const handleProceed = useCallback(() => {
    closeAll();
    console.log("PRIVATE_MODE_HOSTNAME: %o", PRIVATE_MODE_HOSTNAME);
    window.location.href = `https://${PRIVATE_MODE_HOSTNAME}/private`;
  }, [closeAll, router]);

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
        onClose={() => {
          if (!guideOpen) {
            onIntroOpenChange(false);
          }
        }}
        onProceed={handleProceed}
        onOpenGuide={() => onGuideOpenChange(true)}
        onChangeWallet={() => void handleChangeWallet()}
      />
      <PrivateTopupGuideDialog
        open={guideOpen}
        onClose={() => onGuideOpenChange(false)}
        onProceed={handleProceed}
        onChangeWallet={() => void handleChangeWallet()}
      />
    </>
  );
}
