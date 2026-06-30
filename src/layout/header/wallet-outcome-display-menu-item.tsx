"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  OUTCOME_DISPLAY_MODES,
  type OutcomeDisplayMode
} from "@/lib/market/outcome-display-mode";
import { RightArrowIcon } from "@/components/icons";
import { OutcomeDisplayIcon } from "@/layout/header/wallet-menu-icons";
import { walletMenuItemClass } from "@/layout/header/wallet-menu-ui";
import {
  useResolvedOutcomeDisplayMode,
  useSetOutcomeDisplayMode
} from "@/store/user-config-store";

interface WalletOutcomeDisplayMenuItemProps {
  variant?: "menu" | "compact";
  onSelect?: () => void;
}

const MODE_LABEL_KEYS: Record<OutcomeDisplayMode, "outcomeDisplayPrice" | "outcomeDisplayDecimal"> =
  {
    price: "outcomeDisplayPrice",
    decimal: "outcomeDisplayDecimal"
  };

export function WalletOutcomeDisplayMenuItem({
  variant = "menu",
  onSelect
}: WalletOutcomeDisplayMenuItemProps) {
  const t = useTranslations("wallet");
  const resolvedMode = useResolvedOutcomeDisplayMode();
  const setOutcomeDisplayMode = useSetOutcomeDisplayMode();
  const [expanded, setExpanded] = useState(false);

  function handleSelect(mode: OutcomeDisplayMode) {
    setOutcomeDisplayMode(mode);
    setExpanded(false);
    onSelect?.();
  }

  const resolvedLabel = t(MODE_LABEL_KEYS[resolvedMode]);

  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          type="button"
          className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-[20px] px-3 text-sm text-prophet-foreground transition-colors hover:bg-prophet-base"
          aria-label={t("outcomeDisplay")}
          aria-haspopup="listbox"
          onClick={() => setExpanded((value) => !value)}
        >
          <OutcomeDisplayIcon />
          <span className="ml-1.5 max-w-[72px] truncate text-xs font-medium">
            {resolvedLabel}
          </span>
        </button>
        {expanded ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[160px] rounded-xl border border-prophet-line bg-prophet-panel p-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
            {OUTCOME_DISPLAY_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                role="option"
                aria-selected={mode === resolvedMode}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-prophet-hover",
                  mode === resolvedMode ? "font-medium text-prophet-foreground" : "text-prophet-muted"
                )}
                onClick={() => handleSelect(mode)}
              >
                <span>{t(MODE_LABEL_KEYS[mode])}</span>
                {mode === resolvedMode ? (
                  <span className="text-xs text-[#3168FF]">✓</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        role="menuitem"
        className={walletMenuItemClass}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="flex items-center gap-2">
          <div className="w-[14px] text-prophet-muted">
            <OutcomeDisplayIcon />
          </div>
          <span>{t("outcomeDisplay")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-prophet-muted">{resolvedLabel}</span>
          <RightArrowIcon />
        </div>
      </button>

      {expanded ? (
        <div className="mt-1 flex flex-col gap-0.5 border-t border-prophet-line pt-1">
          {OUTCOME_DISPLAY_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="menuitem"
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-prophet-hover",
                mode === resolvedMode ? "font-medium text-prophet-foreground" : "text-prophet-muted"
              )}
              onClick={() => handleSelect(mode)}
            >
              <span>{t(MODE_LABEL_KEYS[mode])}</span>
              {mode === resolvedMode ? (
                <span className="text-xs text-[#3168FF]">✓</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
