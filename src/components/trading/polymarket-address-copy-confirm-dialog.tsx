"use client";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyIcon } from "@/components/icons";
import { Modal } from "@/components/ui/modal";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { POLYGON_ACCEPTED_USDC_TOKENS } from "@/lib/funding/polygon-usdc-tokens";
import { cn } from "@/lib/cn";
import { fundingPrimaryButtonClass } from "@/views/portfolio/shared/funding-modal-shell";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";

export interface PolymarketAddressCopyConfirmDialogProps {
  open: boolean;
  address: string;
  onClose: () => void;
}

export function PolymarketAddressCopyConfirmDialog({
  open,
  address,
  onClose,
}: PolymarketAddressCopyConfirmDialogProps) {
  const { copy } = useCopyWithToast();

  async function handleConfirmCopy() {
    const ok = await copy(address);
    if (ok) {
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Copy deposit address"
      className="w-full max-w-[472px]"
    >
      <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]">
        <h2 className="m-0 pr-8 text-xl font-[500] leading-6 text-black">
          Copy deposit address
        </h2>

        <p className="m-0 mt-4 text-sm leading-normal text-black">
          This address only accepts USDC / USDC.e transfers.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {POLYGON_ACCEPTED_USDC_TOKENS.map((token) => (
            <div
              key={token.symbol}
              className="flex items-start gap-2 rounded-[8px] border border-[#EBEBEB] bg-[#fafbfc] px-3 py-2.5"
            >
              <span className="shrink-0 text-sm font-[500] text-black">
                {token.symbol}
              </span>
              <span className="min-w-0 flex-1 break-all font-mono text-xs leading-normal text-[#909090]">
                {token.address}
              </span>
              <CopyButton
                text={token.address}
                ariaLabel={`Copy ${token.symbol} token address`}
                className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-black"
              >
                <CopyIcon />
              </CopyButton>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className={portfolioSecondaryButtonClass}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(fundingPrimaryButtonClass, "w-full")}
            disabled={!address}
            onClick={() => void handleConfirmCopy()}
          >
            Copy address
          </button>
        </div>
      </div>
    </Modal>
  );
}
