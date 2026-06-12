"use client";

import type { ReactNode } from "react";

import { CopiedToast } from "@/components/feedback/copied-toast";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { cn } from "@/lib/cn";

const DEFAULT_TOAST_CLASS =
  "pointer-events-none absolute left-1/2 bottom-full z-10 mb-2 -translate-x-1/2";

export type CopyButtonProps = {
  text: string | undefined | (() => string | undefined);
  ariaLabel: string;
  className?: string;
  toastClassName?: string;
  disabled?: boolean;
  onCopy?: () => void;
  children: ReactNode;
};

export function CopyButton({
  text,
  ariaLabel,
  className,
  toastClassName,
  disabled = false,
  onCopy,
  children
}: CopyButtonProps) {
  const { copiedVisible, copy } = useCopyWithToast();

  const handleCopy = async () => {
    onCopy?.();
    const value = typeof text === "function" ? text() : text;
    await copy(value);
  };

  return (
    <div className="relative">
      <CopiedToast
        visible={copiedVisible}
        className={cn(DEFAULT_TOAST_CLASS, toastClassName)}
      />

      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => void handleCopy()}
      >
        {children}
      </button>
    </div>
  );
}
