import { cn } from "@/lib/cn";

export const copyTradePanelClass = cn(
  "overflow-hidden rounded-xl border border-prophet-line bg-prophet-panel"
);

export const copyTradeModalClass = cn(
  "w-full max-w-[500px] rounded-[20px] border border-prophet-line bg-prophet-panel"
);

export const copyTradeModalCloseButtonClass = cn(
  "border-0 bg-transparent text-prophet-muted hover:bg-transparent hover:text-prophet-foreground"
);

export const copyTradeInfoBoxClass = cn(
  "flex flex-col gap-1 rounded-[8px] border border-prophet-line bg-prophet-action-panel px-4 py-3"
);

export const copyTradeTooltipClass = cn(
  "max-w-[280px] rounded-xl border border-prophet-line bg-prophet-panel px-4 py-3 text-sm leading-[150%] text-prophet-foreground shadow-prophet"
);

export const copyTradePrimaryButtonClass = cn(
  "inline-flex items-center justify-center rounded-lg bg-prophet-primary text-prophet-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
);

export const copyTradeModalSurfaceClass = cn(copyTradeModalClass, "p-5 shadow-prophet");

export const copyTradeTableMobileListClass = "flex flex-col gap-2 md:hidden";

export const copyTradeTableMobileCardClass = cn(
  "flex flex-col gap-3 rounded-xl border border-prophet-line bg-prophet-panel px-4 py-3"
);

export const copyTradeTableDesktopRowClass = "hidden md:grid";
