"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/auth/use-auth";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";
import { ComboPositionCashoutShareModal } from "@/views/combo/share-modal/combo-position-cashout-share-modal";
import { ComboPositionShareModal } from "@/views/combo/share-modal/combo-position-share-modal";

import {
  positionCardModalShellClassName,
  positionCardModalShellStyle
} from "./constants";
import { PositionCardModalActions } from "./position-card-modal-actions";
import { PositionCardModalHeader } from "./position-card-modal-header";
import { PositionCardModalPickList } from "./position-card-modal-pick-list";
import { PositionCardModalSummary } from "./position-card-modal-summary";
import { PositionCardModalTicketDivider } from "./position-card-modal-ticket-divider";
import type { PositionCardModalProps } from "./types";
import { usePositionCardModalCashout } from "./use-position-card-modal-cashout";

export type { PositionCardModalProps } from "./types";

export function PositionCardModal({
  open,
  combo,
  onClose
}: PositionCardModalProps) {
  const t = useTranslations("combo");
  const { auth, cashout } = usePositionCardModalCashout(combo, open, onClose);

  const { session } = useAuth();
  const { content: referralContent } = useProphetReferral();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [cashoutShareModalOpen, setCashoutShareModalOpen] = useState(false);

  console.log("combo: %o", combo);

  return (
    <>
      <Modal
        open={open && combo != null}
        onClose={onClose}
        ariaLabel="Combo position details"
        className={positionCardModalShellClassName}
        hideCloseButton
      >
        {combo ? (
          <div style={positionCardModalShellStyle}>
            <PositionCardModalHeader
              pickCount={combo.picks.length}
              onClose={onClose}
            />

            <PositionCardModalPickList picks={combo.picks} />

            <PositionCardModalTicketDivider />

            <PositionCardModalSummary
              multiplier={combo.multiplier}
              stakeAmount={combo.stakeAmount}
              toWinAmount={combo.toWinAmount}
              firstEntryAt={combo.firstEntryAt}
            />

            <PositionCardModalActions
              cashoutAmount={cashout.cashoutAmount}
              isAuthenticated={cashout.isAuthenticated}
              loginInProgress={auth.loginInProgress}
              isQuoteLoading={cashout.isQuoteLoading}
              isSubmitting={cashout.isSubmitting}
              isCashoutDisabled={cashout.isCashoutDisabled}
              connectWalletLabel={t("connectWallet")}
              connectingLabel={t("connecting")}
              onConnectWallet={() => void auth.openLogin()}
              onCashout={() => void cashout.submitCashout()}
            />
          </div>
        ) : null}
      </Modal>

      <ComboPositionShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        combo={combo}
        funderAddress={session?.funderAddress}
        kickback={referralContent?.kickback}
      />

      <ComboPositionCashoutShareModal
        open={cashoutShareModalOpen}
        onClose={() => setCashoutShareModalOpen(false)}
        combo={combo}
        funderAddress={session?.funderAddress}
        kickback={referralContent?.kickback}
      />
    </>
  );
}
