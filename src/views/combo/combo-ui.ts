import { cn } from "@/lib/cn";
import { homeLoadingSurfaceClass } from "@/views/home/home-ui";

export const comboPanelClass = cn(
  "overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel dark:bg-prophet-action-panel"
);

export const comboMutedTextClass = "text-prophet-muted dark:text-white";

export const comboTitleTextClass = "text-prophet-foreground";

export const comboPrimaryButtonClass = cn(
  "bg-black dark:bg-prophet-primary text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const comboSecondaryButtonClass = cn(
  "border border-prophet-line bg-prophet-panel dark:bg-[rgba(255,255,255,0.05)] text-prophet-foreground transition-colors hover:bg-prophet-hover",
  "disabled:cursor-not-allowed disabled:opacity-70"
);

export const comboMultiplierBadgeClass = cn(
  "inline-flex h-7 shrink-0 items-center rounded-[15px] bg-black px-3 text-sm font-[500] leading-[18px] text-white dark:bg-white dark:text-prophet-primary"
);

export const comboSkeletonClass = cn(
  "inline-flex h-7 w-[52px] shrink-0 animate-pulse rounded-[15px]",
  homeLoadingSurfaceClass
);

export const comboBidInputShellClass = cn(
  "flex items-center justify-between rounded-md border border-prophet-line bg-prophet-panel dark:bg-[rgba(255,255,255,0.05)] px-4"
);

export const comboInnerCardClass = "rounded-xl bg-prophet-action-panel/50 p-2.5";

export const comboInnerCardSolidClass = cn(
  "rounded-md border border-prophet-line bg-prophet-panel dark:bg-[rgba(255,255,255,0.05)] px-3 py-2.5"
);

export const comboDividerClass = "border-t border-dashed border-prophet-line";

export const comboTooltipClass = cn(
  "rounded-lg border border-prophet-line bg-prophet-panel px-3 py-2 text-sm font-[400] text-prophet-foreground shadow-[0_0_10px_0_rgba(0,0,0,0.10)]"
);

export const comboOddsButtonBaseClass =
  "flex items-center justify-between border border-prophet-line transition-colors";

export function comboOddsButtonStateClass({
  selected,
  disabled
}: {
  selected?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return "cursor-not-allowed border-prophet-line opacity-70 text-prophet-muted";
  }

  if (selected) {
    return "border-prophet-line bg-[linear-gradient(180deg,#666666_0%,#000000_100%)] dark:bg-prophet-primary dark:[background-image:unset] text-white";
  }

  return "bg-prophet-hover text-prophet-foreground hover:bg-prophet-action-panel";
}

export function comboOddsButtonLabelClass({
  selected,
  disabled,
  mutedLabel
}: {
  selected?: boolean;
  disabled?: boolean;
  mutedLabel?: boolean;
}) {
  if (disabled) {
    return "text-prophet-muted";
  }

  if (selected) {
    return "text-white";
  }

  if (mutedLabel) {
    return "text-prophet-muted";
  }

  return "text-prophet-foreground";
}

export type ComboShellVariant =
  | "widget"
  | "position"
  | "entry"
  | "entryHover"
  | "entryHomeMobile"
  | "mobile"
  | "mobileBidSheet"
  | "modal";

export function comboShellBackground(variant: ComboShellVariant): string {
  const panel = "var(--prophet-bg-panel)";

  switch (variant) {
    case "widget":
      return `linear-gradient(360deg, rgba(45, 151, 243, 0.1) 0%, rgba(177, 68, 255, 0.1) 90.8%), ${panel}`;
    case "position":
      return `linear-gradient(360deg, rgba(45, 151, 243, 0) 0%, rgba(177, 68, 255, 0.1) 90.8%), ${panel}`;
    case "modal":
      return `linear-gradient(360deg, rgba(45, 151, 243, 0.1) -26.99%, rgba(177, 68, 255, 0.1) 88.31%), ${panel}`;
    case "mobile":
      return `linear-gradient(360deg, rgba(45, 151, 243, 0.1) 0%, rgba(177, 68, 255, 0.1) 100%), ${panel}`;
    case "mobileBidSheet":
      return `linear-gradient(360deg, rgba(45, 151, 243, 0) 0%, rgba(177, 68, 255, 0.1) 100%), ${panel}`;
    case "entry":
      return `linear-gradient(90deg, rgba(177, 68, 255, 0.1) 0%, rgba(45, 151, 243, 0.1) 100%), ${panel}`;
    case "entryHover":
      return `linear-gradient(90deg, rgba(177, 68, 255, 0.16) 0%, rgba(45, 151, 243, 0.16) 100%), ${panel}`;
    case "entryHomeMobile":
      return `linear-gradient(360deg, rgba(45, 151, 243, 0.1) 0%, rgba(177, 68, 255, 0.1) 100%), ${panel}`;
    default:
      return panel;
  }
}
