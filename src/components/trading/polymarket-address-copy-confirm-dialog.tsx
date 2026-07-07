"use client";

import type { ReactNode } from "react";

import { Modal } from "@/components/ui/modal";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { cn } from "@/lib/cn";
import { fundingPrimaryButtonClass } from "@/views/portfolio/shared/funding-modal-shell";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";

const DEPOSIT_ADDRESS_STEPS: Array<{
  title: ReactNode;
  description: ReactNode;
}> = [
  {
    title: "Copy deposit address",
    description: "Copy your Polymarket deposit address using the button below."
  },
  {
    title: <>Transfer on Polygon</>,
    description: (
      <>
        Send only <strong className="font-[600] text-prophet-foreground">USDC</strong> or{" "}
        <strong className="font-[600] text-prophet-foreground">USDC.e</strong> on{" "}
        <strong className="font-[600] text-prophet-foreground">Polygon</strong> to this
        address.
      </>
    )
  },
  {
    title: "Convert on Portfolio",
    description:
      "After the transfer completes, go to Portfolio to convert the tokens."
  }
];

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
      className="w-full min-w-0 max-w-[472px] overflow-x-hidden"
    >
      <div
        data-polymarket-address-copy-dialog
        className="min-w-0 rounded-[20px] border border-prophet-line bg-prophet-panel p-5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
      >
        <h2 className="m-0 pr-8 text-xl font-[500] leading-6 text-prophet-foreground">
          Copy deposit address
        </h2>

        <ol className="m-0 mt-5 flex list-none flex-col p-0">
          {DEPOSIT_ADDRESS_STEPS.map((step, index) => {
            const isLast = index === DEPOSIT_ADDRESS_STEPS.length - 1;

            return (
              <li key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-prophet-panel text-sm font-[500] text-prophet-foreground"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  {!isLast ? (
                    <span
                      className="my-1 w-px flex-1 min-h-6 bg-prophet-line"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                  <p className="m-0 text-sm font-[500] leading-normal text-prophet-foreground">
                    {step.title}
                  </p>
                  <p className="m-0 mt-1 text-sm font-[400] leading-normal text-[#909090]">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

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
