"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { fundingModalCardClass } from "@/views/portfolio/shared/funding-modal-shell";

import { useStrategyBidOverlayLayout } from "./strategy-bid-responsive-overlay";

export type StrategyBidModalShellProps = {
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function StrategyBidModalShell({
  onClose,
  children,
  footer,
  className
}: StrategyBidModalShellProps) {
  const t = useTranslations("strategy");
  const tCommon = useTranslations("common");
  const layout = useStrategyBidOverlayLayout();
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
      <header className="relative flex shrink-0 items-center justify-between px-5 pb-4 pt-5">
        <h2 className="m-0 font-[Sora] text-xl font-medium leading-[25px] text-prophet-foreground">
          {t("joinStrategy")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 items-center justify-center border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-prophet-foreground"
          aria-label={tCommon("close")}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>

      {footer ? (
        <footer className="shrink-0 px-5 pb-10 pt-2 md:pb-5">{footer}</footer>
      ) : null}
    </div>
  );
}
