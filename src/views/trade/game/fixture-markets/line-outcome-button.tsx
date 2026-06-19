"use client";

import { cn } from "@/lib/cn";
import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";
import { gameColors } from "@/views/trade/game/ui";

export type LineOutcomeButtonVariant =
  | "home"
  | "draw"
  | "away"
  | "over"
  | "under"
  | "yes"
  | "no";

const variantStyles: Record<LineOutcomeButtonVariant, string> = {
  home: gameColors.home,
  draw: "#A5A5A5",
  away: gameColors.awayBar,
  over: gameColors.home,
  under: gameColors.awayBar,
  yes: "#65AF14",
  no: "#FF674B"
};

export function LineOutcomeButton({
  label,
  price,
  variant,
  active = false,
  disabled = false,
  onClick,
  className,
}: {
  label: string;
  price?: number;
  variant: LineOutcomeButtonVariant;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const color = variantStyles[variant];
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={
        {
          "--line-outcome-color": color,
          borderColor: color,
          ...(active ? { backgroundColor: color } : {})
        } as React.CSSProperties
      }
      className={cn(
        "flex h-[40px] md:h-[44px] min-w-[80px] md:min-w-[120px] shrink-0 items-center justify-center gap-1.5 md:rounded-[12px] rounded-[8px] border bg-white px-2 md:px-4 text-sm font-[500] leading-[17px] transition-colors duration-200 ease-out",
        disabled
          ? "cursor-not-allowed opacity-40"
          : onClick
            ? "cursor-pointer"
            : "cursor-default",
        active ? "text-white" : "text-black",
        !disabled &&
          !active &&
          onClick &&
          "hover:bg-[var(--line-outcome-color)] hover:text-white",
        className
      )}
    >
      <span>{label}</span>
      {price !== undefined ? (
        <span>{formatOutcomeDisplay(price)}</span>
      ) : null}
    </button>
  );
}
