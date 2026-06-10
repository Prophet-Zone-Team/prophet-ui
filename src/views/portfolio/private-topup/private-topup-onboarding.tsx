"use client";

import { useCallback, useState } from "react";

import { useAuth } from "@/context/auth";
import { PrivateTopupGuideDialog } from "@/views/portfolio/private-topup/private-topup-guide-dialog";
import { PrivateTopupIntroDialog } from "@/views/portfolio/private-topup/private-topup-intro-dialog";
import { PRIVATE_MODE_HOSTNAME } from "@/config/funding";
import {
  authenticateConfidential,
  getConfidentialSession,
  requestConfidentialChallenge,
} from "@/lib/confidential/client";
import { signConfidentialMessage } from "@/lib/confidential/sign-message";

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
  const [proceeding, setProceeding] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const closeAll = useCallback(() => {
    onGuideOpenChange(false);
    onIntroOpenChange(false);
  }, [onGuideOpenChange, onIntroOpenChange]);

  const redirectToPrivate = useCallback(() => {
    // window.location.href = `https://${PRIVATE_MODE_HOSTNAME}/private`;
    window.location.href = `/private`;
  }, []);

  const handleProceed = useCallback(async () => {
    if (proceeding) {
      return;
    }

    setProceeding(true);
    setError(undefined);

    try {
      const session = await getConfidentialSession();

      if (
        session.authenticated &&
        session.eoaAddress?.toLowerCase() === walletAddress.toLowerCase()
      ) {
        closeAll();
        redirectToPrivate();
        return;
      }

      const challenge = await requestConfidentialChallenge(walletAddress);
      const signature = await signConfidentialMessage(walletAddress, challenge.message);
      await authenticateConfidential({
        eoaAddress: walletAddress,
        message: challenge.message,
        signature,
      });

      closeAll();
      redirectToPrivate();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to enter Private Mode.");
    } finally {
      setProceeding(false);
    }
  }, [closeAll, proceeding, redirectToPrivate, walletAddress]);

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
        proceeding={proceeding}
        error={error}
        onClose={() => {
          if (!guideOpen && !proceeding) {
            onIntroOpenChange(false);
          }
        }}
        onProceed={() => void handleProceed()}
        onOpenGuide={() => onGuideOpenChange(true)}
        onChangeWallet={() => void handleChangeWallet()}
      />
      <PrivateTopupGuideDialog
        open={guideOpen}
        proceeding={proceeding}
        error={error}
        onClose={() => {
          if (!proceeding) {
            onGuideOpenChange(false);
          }
        }}
        onProceed={() => void handleProceed()}
        onChangeWallet={() => void handleChangeWallet()}
      />
    </>
  );
}
