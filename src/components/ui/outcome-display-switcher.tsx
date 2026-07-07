"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { cn } from "@/lib/cn";
import type { OutcomeDisplayMode } from "@/lib/market/outcome-display-mode";

const SWITCHER_OPTIONS: OutcomeDisplayMode[] = ["decimal", "price"];

const MODE_LABEL_KEYS: Record<
  OutcomeDisplayMode,
  "outcomeDisplayPrice" | "outcomeDisplayDecimal"
> = {
  price: "outcomeDisplayPrice",
  decimal: "outcomeDisplayDecimal"
};

const PILL_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};

export interface OutcomeDisplaySwitcherProps {
  value: OutcomeDisplayMode;
  onChange: (mode: OutcomeDisplayMode) => void;
  className?: string;
  "aria-label"?: string;
}

export function OutcomeDisplaySwitcher({
  value,
  onChange,
  className,
  "aria-label": ariaLabel
}: OutcomeDisplaySwitcherProps) {
  const t = useTranslations("wallet");
  const pillLayoutId = `${useId()}-outcome-display-pill`;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex h-[30px] w-[203px] shrink-0 rounded-lg border border-prophet-line bg-prophet-panel p-[2px]",
        className
      )}
    >
      {SWITCHER_OPTIONS.map((mode) => {
        const isActive = mode === value;

        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(mode)}
            className="relative flex min-w-0 flex-1 items-center justify-center border-0 bg-transparent p-0 cursor-pointer"
          >
            {isActive ? (
              <motion.span
                layoutId={pillLayoutId}
                aria-hidden="true"
                className="absolute inset-0 rounded-md bg-black"
                transition={PILL_TRANSITION}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 px-1 text-center text-xs leading-[15px] font-[400] transition-colors duration-200",
                isActive ? "text-white" : "text-prophet-foreground"
              )}
            >
              {t(MODE_LABEL_KEYS[mode])}
            </span>
          </button>
        );
      })}
    </div>
  );
}
