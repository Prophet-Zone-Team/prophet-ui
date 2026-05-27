import { cn } from "@/lib/cn";

export const tradePageClass =
  "mx-auto max-w-[1440px] px-4 pb-10 pt-2 sm:px-6";

export const tradePanelClass = cn(
  "flex w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white",
  "mx-auto xl:mx-0"
);

export const tradeSectionClass = "";

export const tradePanelHeadClass =
  "flex flex-wrap items-center justify-between gap-2 border-b border-prophet-line px-4 py-3";

export const tradePanelTitleClass =
  "m-0 text-base font-[556] text-black sm:text-lg";

export const tradeTableHeadClass =
  "grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted";

export const tradeTableRowClass =
  "grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line/60 px-4 py-2.5 text-sm last:border-b-0";


export function tradeYesNoPill(active: boolean, side: "yes" | "no") {
  return cn(
    "rounded-[6px] px-3 py-1 text-sm font-[556] leading-[17px] transition-colors",
    side === "yes"
      ? active
        ? "bg-[#65AF14] text-white"
        : "text-prophet-muted"
      : active
        ? "bg-[#65AF14] text-white"
        : "text-[#FF674B]"
  );
}

export const tradeBidButtonClass = cn(
  "flex h-[46px] w-full items-center justify-center rounded-xl text-lg font-[556] text-white transition-opacity",
  "bg-[#65AF14] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
);

export const tradeQuickAmountClass = cn(
  "flex h-[30px] items-center justify-center rounded-lg border border-prophet-line bg-white px-3",
  "text-sm font-[457] text-prophet-muted transition-colors hover:bg-[#fafbfc]"
);

export const tradeMarketButtonClass = cn(
  "flex h-8 shrink-0 items-center gap-1 rounded-md border border-prophet-line bg-white px-2.5",
  "text-[18px] font-[500] leading-[17px] text-black"
);
