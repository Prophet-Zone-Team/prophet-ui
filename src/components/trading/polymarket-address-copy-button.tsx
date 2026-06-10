"use client";

import { useState, type ReactNode } from "react";

import { PolymarketAddressCopyConfirmDialog } from "@/components/trading/polymarket-address-copy-confirm-dialog";

export interface PolymarketAddressCopyButtonProps {
  address: string | undefined;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}

export function PolymarketAddressCopyButton({
  address,
  ariaLabel,
  className,
  children,
}: PolymarketAddressCopyButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        disabled={!address}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      <PolymarketAddressCopyConfirmDialog
        open={open}
        address={address ?? ""}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
