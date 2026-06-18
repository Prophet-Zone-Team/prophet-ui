"use client";

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

export type { PositionCardModalProps } from "./types";

export function PositionCardModal({
  open,
  combo,
  onClose
}: PositionCardModalProps) {
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

          <PositionCardModalActions cashoutAmount={combo.cashoutAmount} />
        </div>
      ) : null}
    </Modal>
  );
}
