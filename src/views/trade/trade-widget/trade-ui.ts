import { cn } from "@/lib/cn";

export const tradePageClass =
  "mx-auto max-w-[1440px] px-4 pb-10 md:pt-2 sm:px-6";

export const tradePanelClass = cn(
  "flex w-full flex-col overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel",
  "mx-auto xl:mx-0"
);

export const tradeSectionClass = "";

export const tradePanelHeadClass =
  "flex flex-wrap items-center justify-between gap-2 border-b border-prophet-line px-4 py-3";

export const tradePanelTitleClass =
  "m-0 text-base font-[500] text-prophet-foreground sm:text-lg";

export const tradeTableHeadClass =
  "grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted";

export const tradeTableRowClass =
  "grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line/60 px-4 py-2.5 text-sm last:border-b-0";

export function tradeYesNoPill(active: boolean, side: "yes" | "no") {
  return cn(
    "rounded-[6px] px-3 py-1 text-sm font-[500] leading-[17px] transition-colors",
    side === "yes"
      ? active
        ? "bg-[#65AF14] text-white"
        : "text-prophet-muted"
      : active
        ? "bg-[#65AF14] text-white"
        : "text-[#FF674B]"
  );
}

const tradeBidButtonBaseClass = cn(
  "flex h-[46px] w-full items-center justify-center rounded-xl text-lg font-[500] text-white transition-opacity",
  "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
);

export const tradeBidButtonClass = cn(tradeBidButtonBaseClass, "bg-[#65AF14]");

export function tradeOutcomeBidButtonClass(outcomeSide: "yes" | "no") {
  return cn(
    tradeBidButtonBaseClass,
    outcomeSide === "yes" ? "bg-[#65AF14]" : "bg-[#FF674B]"
  );
}

export const TRADE_BID_BUTTON_ID = "widget-trade-bid-button";

export const tradeQuickAmountClass = cn(
  "flex h-[30px] items-center justify-center rounded-lg border border-prophet-line bg-prophet-panel px-3",
  "text-sm font-[400] text-prophet-muted transition-colors hover:bg-prophet-base"
);

export const tradeQuickAmountSelectedClass = cn(
  "border-black bg-[#F5F5F5] text-prophet-foreground"
);

export const tradeMarketButtonClass = cn(
  "flex h-8 shrink-0 items-center gap-1 rounded-md border border-prophet-line bg-prophet-panel px-2.5",
  "text-[14px] font-[400] leading-[17px] text-prophet-foreground"
);
