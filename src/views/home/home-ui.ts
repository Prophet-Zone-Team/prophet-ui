import { cn } from "@/lib/cn";

export const homePanelClass = cn(
  "overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel"
);

export const homeCardClass = cn(
  "rounded-xl border border-prophet-line bg-prophet-panel"
);

export const homeCardInteractiveClass = cn(
  homeCardClass,
  "cursor-pointer transition-colors hover:border-prophet-line hover:bg-prophet-hover"
);

export const homeEmptyStateClass = cn(
  homeCardClass,
  "min-w-0 px-4 py-8 text-center"
);

export const homeLoadingSurfaceClass = cn(
  "rounded-[7px] bg-[linear-gradient(90deg,rgba(225,237,249,0.72),rgba(255,255,255,0.94),rgba(225,237,249,0.72))] dark:bg-[linear-gradient(90deg,rgba(40,40,40,0.72),rgba(36,36,39,0.94),rgba(40,40,40,0.72))] bg-prophet-shimmer animate-prophet-loading"
);

export const homeFilterPillClass = cn(
  "inline-flex items-center gap-1.5 rounded-[20px] border border-prophet-muted px-[10px] md:px-[16px] text-[12px] md:text-[16px] font-[400] leading-[19px] transition-colors"
);

export const homeFilterPillActiveClass = cn(
  homeFilterPillClass,
  "bg-black dark:bg-prophet-primary text-white"
);

export const homeFilterPillInactiveClass = cn(
  homeFilterPillClass,
  "bg-prophet-panel text-prophet-foreground"
);

export const homeOutlineButtonClass = cn(
  "inline-flex items-center justify-center rounded-lg border border-prophet-muted bg-prophet-panel",
  "text-[14px] font-[500] leading-[17px] text-prophet-foreground transition-colors hover:bg-prophet-hover"
);

export const homeBidButtonClass = cn(
  "inline-flex items-center justify-center gap-1 rounded-lg bg-[#18110F] dark:bg-prophet-primary",
  "text-[14px] font-[500] leading-[17px] text-white disabled:cursor-wait disabled:opacity-70"
);

export function homeMarketListRowBackground(changePercent: number): string {
  return changePercent >= 0
    ? "linear-gradient(90deg, rgba(220, 255, 181, 0.20) 0%, rgba(255, 255, 255, 0.20) 38.67%), var(--prophet-bg-panel)"
    : "linear-gradient(90deg, rgba(255, 181, 181, 0.20) 0%, rgba(255, 255, 255, 0.20) 38.67%), var(--prophet-bg-panel)";
}
