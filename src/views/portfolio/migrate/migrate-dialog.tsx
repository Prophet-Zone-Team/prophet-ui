"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth";
import { useMigrate } from "@/context/migrate";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { FundingModalShell } from "@/views/portfolio/shared/funding-modal-shell";
import { MigrateConfirmStep } from "@/views/portfolio/migrate/migrate-confirm-step";
import { MigratePromptStep } from "@/views/portfolio/migrate/migrate-prompt-step";
import { MigrateSetupStep } from "@/views/portfolio/migrate/migrate-setup-step";
import type { MigrateDialogStep } from "@/views/portfolio/migrate/types";

export function MigrateDialog() {
  const t = useTranslations("portfolio.migrate");
  const { session, cash } = useAuth();
  const {
    snapshot,
    dialogOpen,
    dialogStep,
    submitting,
    submitError,
    closeMigrateDialog,
    setDialogStep,
    executeMigration,
  } = useMigrate();

  const sourceAccount = snapshot?.bestAccount;
  const funderAddress = session?.funderAddress;

  const title = useMemo(() => {
    switch (dialogStep) {
      case "prompt":
        return t("detectedBalanceTitle");
      case "setup":
        return t("migrateTitle");
      case "confirm":
        return t("migrationTransfer");
    }
  }, [dialogStep, t]);

  if (!sourceAccount || !funderAddress) {
    return null;
  }

  return (
    <FundingResponsiveOverlay
      open={dialogOpen}
      onClose={closeMigrateDialog}
      ariaLabel={t("ariaDefault")}
      overlayCloseable={false}
      closeButtonClassName={dialogStep === "prompt" ? "bg-[none] border-0 text-white" : ""}
    >
      {dialogStep === "prompt" ? (
        <div className="w-[492px] overflow-hidden rounded-[20px] bg-white shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]">
          <MigratePromptStep
            account={sourceAccount}
            onIgnore={closeMigrateDialog}
            onContinue={() => setDialogStep("setup")}
            onClose={closeMigrateDialog}
          />
        </div>
      ) : (
        <FundingModalShell
          title={title}
          onClose={closeMigrateDialog}
          onBack={dialogStep === "confirm" ? () => setDialogStep("setup") : undefined}
          className="w-[492px]"
          footer={undefined}
        >
          {dialogStep === "setup" ? (
            <MigrateSetupStep
              sourceAccount={sourceAccount}
              destinationAddress={funderAddress}
              destinationBalanceUsd={cash?.available}
              onContinue={() => setDialogStep("confirm")}
            />
          ) : null}
          {dialogStep === "confirm" ? (
            <MigrateConfirmStep
              sourceAccount={sourceAccount}
              destinationAddress={funderAddress}
              submitting={submitting}
              submitError={submitError}
              onSubmit={executeMigration}
            />
          ) : null}
        </FundingModalShell>
      )}
    </FundingResponsiveOverlay>
  );
}

export type { MigrateDialogStep };
