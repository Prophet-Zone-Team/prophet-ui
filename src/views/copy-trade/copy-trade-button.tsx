"use client";

import type { MouseEvent } from "react";

import Popover from "@/components/popover";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { copyTradeTooltipClass } from "@/views/copy-trade/copy-trade-ui";

export interface CopyTradeButtonProps {
  busy: boolean;
  disabled: boolean;
  disabledReason: string | null;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  size?: "default" | "compact";
}

export function CopyTradeButton({
  busy,
  disabled,
  disabledReason,
  onClick,
  className,
  size = "default"
}: CopyTradeButtonProps) {
  const tCommon = useTranslations("copyTrade.common");
  const isCompact = size === "compact";

  const button = (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg transition-opacity disabled:cursor-not-allowed",
        isCompact
          ? "h-[30px] text-[14px] leading-[18px]"
          : "h-10 text-[16px] leading-5",
        busy
          ? cn(
              "border border-prophet-muted bg-transparent text-prophet-foreground opacity-50",
              isCompact ? "w-[84px]" : "w-[84px]"
            )
          : cn(
              "bg-prophet-primary text-prophet-primary-foreground hover:opacity-90",
              isCompact ? "w-[77px]" : "w-20",
              disabled && "opacity-30 hover:opacity-30"
            ),
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {busy ? tCommon("copying") : tCommon("copy")}
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <Popover
        placement="Top"
        trigger="Hover"
        offset={8}
        contentClassName="z-[12]"
        content={
          <div className={copyTradeTooltipClass}>{disabledReason}</div>
        }
      >
        <span className="inline-flex">{button}</span>
      </Popover>
    );
  }

  return button;
}
