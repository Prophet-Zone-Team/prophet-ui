import { cn } from "@/lib/cn";

export const portfolioPageClass = "mx-auto w-[1112px] px-4 py-8 sm:px-6";

export const portfolioSummaryCardClass = cn(
  "box-border min-h-[300px] rounded-[20px] border border-prophet-line bg-white p-6 sm:p-8 lg:h-[300px]"
);

export const portfolioActivityCardClass = cn(
  "box-border flex h-[523px] flex-col overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white"
);

export const portfolioSummaryLabelClass =
  "text-sm font-[556] leading-[17px] text-prophet-muted";

export const portfolioSummaryValueLargeClass =
  "text-[32px] font-[556] leading-[38px] text-black";

export const portfolioSummaryValueMediumClass =
  "text-xl font-[556] leading-12 text-black mt-2";

export const portfolioWalletAddressClass =
  "truncate text-xl font-[556] leading-6 text-black";

export const portfolioAvatarClass = cn(
  "size-[52px] shrink-0 rounded-full border-4 border-white shadow-[0_0_4px_rgba(0,0,0,0.25)]",
  "bg-[radial-gradient(100%_100%_at_50%_0%,#FF6BBA_0%,#4DA0FF_65.38%,#59FFA1_100%)]"
);

export const portfolioDepositButtonClass = cn(
  "flex h-[55px] w-full max-w-[235px] items-center justify-center rounded-xl bg-black",
  "text-base font-[457] leading-[19px] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioWithdrawButtonClass = cn(
  "flex h-[55px] w-full max-w-[235px] items-center justify-center rounded-xl",
  "border border-prophet-muted bg-white text-base font-[457] leading-[19px] text-black",
  "transition-colors hover:bg-[#fafbfc] disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioConnectButtonClass = cn(
  "flex h-[55px] w-full max-w-[235px] items-center justify-center rounded-xl bg-black",
  "text-base font-[457] leading-[19px] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioPositionsTableHeadClass =
  "grid min-w-[720px] grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] gap-3 px-4 py-2 text-xs text-prophet-muted";

export const portfolioPositionsTableRowClass =
  "grid min-w-[720px] grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] gap-3 border-b border-prophet-line/60 px-4 py-3 text-sm last:border-b-0 items-center";

export const portfolioOrdersTableHeadClass =
  "grid min-w-[680px] grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))_auto] gap-3 px-4 py-2 text-xs text-prophet-muted";

export const portfolioOrdersTableRowClass =
  "grid min-w-[680px] grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))_auto] gap-3 border-b border-prophet-line/60 px-4 py-3 text-sm last:border-b-0 items-center";

export const portfolioHistoryTableHeadClass =
  "grid min-w-[720px] grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))] gap-3 px-4 py-2 text-xs text-prophet-muted";

export const portfolioHistoryTableRowClass =
  "grid min-w-[720px] grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))] gap-3 border-b border-prophet-line/60 px-4 py-3 text-sm last:border-b-0 items-center";

export const portfolioActionButtonClass = cn(
  "flex h-8 shrink-0 items-center justify-center rounded-md bg-black px-4",
  "text-sm font-[556] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioTableScrollClass = "min-h-0 flex-1 overflow-auto";
