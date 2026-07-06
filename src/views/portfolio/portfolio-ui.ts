import { cn } from "@/lib/cn";

export const portfolioPageClass =
  "mx-auto w-full md:w-[1112px] px-3 md:px-4 py-[20px] sm:px-6";

export const portfolioSummaryCardClass = cn(
  "box-border min-h-[300px] rounded-[20px] border border-prophet-line bg-prophet-panel p-3 md:p-6 lg:h-[300px]"
);

export const portfolioActivityCardClass = cn(
  "box-border flex min-h-0 flex-col rounded-[12px] border border-prophet-line bg-prophet-panel md:min-h-[523px]"
);

export const portfolioTableDesktopScrollClass =
  "hidden min-h-0 flex-1 md:flex-grow-0 flex-col overflow-x-auto md:flex";

export const portfolioTableMobileListClass = "flex flex-col md:hidden";

export const portfolioTableMobileCardClass = cn(
  "flex flex-col gap-2.5 border-b border-prophet-line px-3 py-3 last:border-b-0"
);

export const portfolioTableMobileLabelClass = "text-xs text-prophet-muted";

export const portfolioTableMobileValueClass = "text-sm font-[500] text-prophet-foreground";

export const portfolioSummaryLabelClass =
  "text-[14px] font-[500] leading-[17px] text-prophet-muted pb-[10px] flex items-center gap-2";

export const portfolioSummaryValueLargeClass =
  "text-[32px] font-[500] leading-[38px] text-prophet-foreground";

export const portfolioSummaryValueMediumClass =
  "text-[32px] md:text-[20px] font-[500] leading-[38px] md:leading-12 text-prophet-foreground mt-2";

export const portfolioPendingDepositButtonClass = cn(
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-prophet-primary px-2 md:px-3 mt-2",
  "text-xs font-[500] leading-[14px] text-prophet-primary-foreground transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "md:absolute md:right-0 md:top-[-55px] md:z-10"
);

export const portfolioWalletAddressClass =
  "truncate text-[20px] font-[500] leading-6 text-prophet-foreground";

export const portfolioAvatarClass = cn(
  "size-[52px] shrink-0 rounded-full border-4 border-prophet-panel shadow-[0_0_4px_rgba(0,0,0,0.25)]",
  "bg-[radial-gradient(100%_100%_at_50%_0%,#FF6BBA_0%,#4DA0FF_65.38%,#59FFA1_100%)]"
);

export const portfolioDepositButtonClass = cn(
  "flex h-[55px] w-[235px] items-center justify-center rounded-xl bg-black dark:bg-prophet-primary",
  "text-base font-[400] leading-[19px] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioWithdrawButtonClass = cn(
  "flex h-[55px] w-full max-w-[235px] items-center justify-center rounded-xl",
  "border border-prophet-muted bg-prophet-panel text-base font-[400] leading-[19px] text-prophet-foreground",
  "transition-colors hover:bg-prophet-hover disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioConnectButtonClass = cn(
  "flex h-[55px] w-full max-w-[235px] items-center justify-center rounded-xl bg-black dark:bg-prophet-primary",
  "text-base font-[400] leading-[19px] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

const portfolioPositionsTableGridColsClass =
  "grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_6rem]";

const portfolioOrdersTableGridColsClass =
  "grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_7.5rem]";

export const portfolioPositionsTableHeadClass = cn(
  "hidden min-w-[720px] gap-3 px-4 py-2 text-xs text-prophet-muted md:grid",
  portfolioPositionsTableGridColsClass
);

export const portfolioPositionsTableRowClass = cn(
  "hidden min-w-[720px] gap-3 border-b border-prophet-line px-4 py-3 text-sm last:border-b-0 items-center md:grid",
  portfolioPositionsTableGridColsClass
);

export const portfolioOrdersTableHeadClass = cn(
  "hidden min-w-[720px] gap-3 px-4 py-2 text-xs text-prophet-muted md:grid",
  portfolioOrdersTableGridColsClass
);

export const portfolioOrdersTableRowClass = cn(
  "hidden min-w-[720px] gap-3 border-b border-prophet-line px-4 py-3 text-sm last:border-b-0 items-center md:grid",
  portfolioOrdersTableGridColsClass
);

const portfolioOpenOrderRowsGridColsClass =
  "grid-cols-[repeat(4,minmax(0,1fr))_5.5rem]";

export const portfolioOpenOrderRowsHeadClass = cn(
  "hidden min-w-[640px] gap-3 px-4 py-2 text-xs text-prophet-muted md:grid",
  portfolioOpenOrderRowsGridColsClass
);

export const portfolioOpenOrderRowsRowClass = cn(
  "hidden min-w-[640px] gap-3 border-b border-prophet-line px-4 py-3 text-sm last:border-b-0 items-center md:grid",
  portfolioOpenOrderRowsGridColsClass
);

const portfolioHistoryTableGridColsClass =
  "grid-cols-[140px_minmax(0,1fr)_5.5rem_10rem]";

export const portfolioHistoryListClass =
  "flex flex-col gap-1 px-3 py-2 md:px-4";

export const portfolioHistoryTableHeadClass = cn(
  "mb-1 hidden w-full grid items-center gap-3 px-3 py-2 text-xs text-prophet-muted md:grid md:gap-4 md:px-4",
  portfolioHistoryTableGridColsClass
);

export const portfolioHistoryRowClass = cn(
  "grid min-h-[62px] w-full items-center gap-3 rounded-[12px] bg-prophet-panel px-3 py-2",
  "text-left transition-colors hover:bg-prophet-hover md:gap-4 md:px-4",
  portfolioHistoryTableGridColsClass
);

export const portfolioHistoryRowLinkClass = cn(
  portfolioHistoryRowClass,
  "cursor-pointer no-underline text-inherit"
);

export const portfolioHistoryMobileCardClass = cn(
  "flex flex-col gap-2.5 rounded-[12px] bg-prophet-panel px-3 py-3 transition-colors hover:bg-prophet-hover"
);

export const portfolioActionButtonClass = cn(
  "flex h-8 shrink-0 items-center justify-center rounded-md bg-prophet-primary px-4",
  "text-sm font-[500] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioSecondaryButtonClass = cn(
  "flex items-center justify-center underline",
  "text-base font-[400] leading-[19px] text-prophet-foreground transition-colors hover:opacity-80",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const portfolioTableScrollClass =
  "flex min-h-0 flex-1 flex-col overflow-x-auto";
