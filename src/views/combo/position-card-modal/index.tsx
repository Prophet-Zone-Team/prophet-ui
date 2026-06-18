"use client";

import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";

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

  return (
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
  );
}
