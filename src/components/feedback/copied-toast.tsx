"use client";

import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export type CopiedToastProps = {
  visible: boolean;
  className?: string;
};

export function CopiedToast({ visible, className }: CopiedToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-[46px] items-center gap-2 rounded-[12px] border border-[#EBEBEB] bg-white px-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <span
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-prophet-green text-white"
        aria-hidden="true"
      >
        <CheckIcon className="size-[11px]" />
      </span>
      <span className="text-[14px] leading-[normal] text-black">Copied!</span>
    </div>
  );
}
