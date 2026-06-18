"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { DEPOSIT_MODAL_WIDTH } from "@/views/portfolio/deposit/config";
import type { TpPolygonSwitchVariant } from "@/hooks/funding/use-tp-polygon-switch-gate";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";

export interface TpPolygonSwitchConfirmDialogProps {
  open: boolean;
  loading?: boolean;
  variant: TpPolygonSwitchVariant;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function TpPolygonSwitchConfirmDialog({
  open,
  loading = false,
  variant,
  onClose,
  onConfirm,
}: TpPolygonSwitchConfirmDialogProps) {
  const tDeposit = useTranslations("portfolio.deposit");
  const tCommon = useTranslations("common");

  const title =
    variant === "close"
      ? tDeposit("tpSwitchPolygonOnCloseTitle")
      : tDeposit("tpSwitchPolygonTitle");

  const description =
    variant === "close"
      ? tDeposit("tpSwitchPolygonOnCloseDescription")
      : tDeposit("tpSwitchPolygonDescription");

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={title}
      className={DEPOSIT_MODAL_WIDTH.step}
      hideCloseButton
      overlayCloseable={false}
    >
      <FundingModalShell title={title} onClose={onClose}>
        <div className="flex flex-col gap-5 pb-2">
          <p className="m-0 text-sm text-[#909090]">{description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
          <button
            type="button"
            className={portfolioSecondaryButtonClass}
            disabled={loading}
            onClick={onClose}
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            className={cn(fundingPrimaryButtonClass, "h-[50px]")}
            disabled={loading}
            onClick={() => void onConfirm()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {tDeposit("tpSwitchPolygonConfirm")}
          </button>
        </div>
      </FundingModalShell>
    </Modal>
  );
}
