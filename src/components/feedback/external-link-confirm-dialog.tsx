"use client";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { fundingPrimaryButtonClass } from "@/views/portfolio/shared/funding-modal-shell";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";

export type ExternalLinkConfirmDialogProps = {
  open: boolean;
  targetHost: string;
  href: string;
  onClose: () => void;
};

const dialogCardClass = cn(
  "w-full max-w-[420px] rounded-[20px] border border-[#EBEBEB] bg-white p-[30px]",
  "shadow-[0_0_10px_rgba(0,0,0,0.1)]"
);

export function ExternalLinkConfirmDialog({
  open,
  targetHost,
  href,
  onClose
}: ExternalLinkConfirmDialogProps) {
  function handleContinue() {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Confirm external link"
      className={dialogCardClass}
      overlayClassName="z-[80]"
      hideCloseButton
    >
      <p className="m-0 text-sm font-[400] leading-[150%] text-prophet-muted">
        You are now leaving our website to visit{" "}
        <span className="font-[500] text-black">{targetHost}</span>. We are not
        responsible for the content or privacy practices of external sites. Do
        you wish to proceed?
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          className={portfolioSecondaryButtonClass}
          onClick={handleContinue}
        >
          Continue
        </button>
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
