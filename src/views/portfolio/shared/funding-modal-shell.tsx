"use client";

import { ChevronLeft, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useFundingOverlayLayout } from "@/views/portfolio/shared/funding-responsive-overlay";

export const fundingModalCardClass = cn(
  "flex w-full flex-col overflow-hidden rounded-[20px] border border-[#EBEBEB] bg-white",
  "shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
);

export const fundingPrimaryButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[8px] bg-black",
  "text-base font-[400] leading-[19px] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export interface FundingModalShellProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function FundingModalShell({
  title,
  onClose,
  onBack,
  children,
  footer,
  className
}: FundingModalShellProps) {
  const layout = useFundingOverlayLayout();
  const isDrawer = layout === "drawer";

  return (
    <div
      className={cn(
        fundingModalCardClass,
        isDrawer &&
          "h-full max-h-[92dvh] min-h-0 rounded-b-none border-b-0 shadow-none",
        className
      )}
    >
      <header className="relative flex shrink-0 items-center justify-center px-5 pb-4 pt-5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-5 top-5 inline-flex h-8 w-8 items-center justify-center border-0 bg-transparent p-0 text-black transition-colors hover:text-[#909090]"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
        <h2 className="m-0 text-xl font-[500] leading-6 text-black">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center border-0 bg-transparent p-0 text-black transition-colors hover:text-[#909090]"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-5">{children}</div>

      {footer ? (
        <footer className="shrink-0 px-5 pb-10 md:pb-5 pt-2">{footer}</footer>
      ) : null}
    </div>
  );
}
