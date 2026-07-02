import { cn } from "@/lib/cn";

export const depositSectionLabelClass =
  "text-sm font-[500] leading-[17px] text-prophet-foreground";

export const depositConnectedRowClass = cn(
  "flex w-full h-[58px] cursor-pointer items-center justify-between rounded-[6px] border border-prophet-line",
  "bg-prophet-panel px-4 py-4 text-left transition-colors hover:bg-prophet-hover"
);

export const depositConnectedRowHighlightedClass = cn(
  depositConnectedRowClass,
  "border-prophet-muted"
);

export const depositBridgeLabelClass = "text-sm font-semibold text-prophet-foreground";

export const depositSourceTabsTrackClass =
  "flex h-[46px] w-full min-w-0 items-center gap-1 rounded-[6px] bg-prophet-action-panel p-1";

export const depositSourceTabActiveClass = cn(
  "flex h-[36px] min-w-0 flex-1 items-center justify-center rounded-[6px] border border-prophet-line",
  "bg-prophet-panel px-2 text-sm font-[500] text-prophet-foreground md:flex-none md:px-4 md:text-base"
);

export const depositSourceTabInactiveClass =
  "flex h-[36px] min-w-0 flex-1 items-center justify-center bg-transparent px-2 text-sm font-[500] text-prophet-foreground transition-opacity hover:opacity-80 md:px-3 md:text-base";

export const depositSourceTabDisabledClass =
  "cursor-not-allowed text-prophet-foreground opacity-50 hover:opacity-50";

export const depositPrivateAccountRowClass = cn(
  "flex w-full items-center justify-between rounded-[6px] border border-prophet-line",
  "bg-prophet-panel px-4 py-4 text-left"
);

export const depositPrivateTopUpLinkClass =
  "inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-[400] text-[#3168ff] transition-opacity hover:opacity-80";

export const depositPrivateFooterLinkClass =
  "inline-flex w-full items-center justify-center gap-1 border-0 bg-transparent p-0 text-base font-[500] text-prophet-foreground transition-opacity hover:opacity-80";

export const depositPrivatePanelDisabledClass = "pointer-events-none opacity-30";

export const depositTokenRowClass = cn(
  "flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors",
  "hover:bg-prophet-action-panel"
);

export const depositTokenRowSelectedClass = "bg-prophet-action-panel";

export const depositTokenRowDisabledClass = "cursor-not-allowed opacity-30 hover:bg-transparent";

export const depositAmountInputClass = cn(
  "w-full border-0 bg-transparent p-0 text-center text-[36px] font-[500] leading-[43px] text-prophet-foreground",
  "outline-none placeholder:text-[#c8c8c8]"
);

export const depositModalAmountInputWrapClass =
  "mx-auto flex w-1/2 min-w-[200px] max-w-[250px] items-baseline";

export const depositModalAmountInputClass = cn(
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-[36px] font-[500] leading-[43px] text-prophet-foreground",
  "outline-none placeholder:text-[#c8c8c8]"
);

export const depositPercentButtonClass = cn(
  "flex h-[30px] min-w-[50px] items-center justify-center rounded-[8px] border border-prophet-line",
  "bg-prophet-panel px-3 text-sm font-[400] text-prophet-muted transition-colors hover:border-prophet-foreground hover:text-prophet-foreground"
);

export const depositTransferBarClass =
  "flex items-center justify-between gap-3 rounded-[6px] bg-prophet-action-panel px-4 py-3";

export const depositFundingWalletChangeClass =
  "border-0 bg-transparent p-0 text-sm font-[400] text-[#3168ff] transition-opacity hover:opacity-80";

export const depositDetailRowClass =
  "flex items-center justify-between py-3 text-sm last:border-b-0 gap-2";

export const depositBreakdownBoxClass = "rounded-[6px] bg-prophet-action-panel p-4";

export const depositBreakdownRowClass =
  "flex items-center justify-between py-1 text-sm text-prophet-muted";

export const depositStableflowQrMinLabelClass =
  "text-sm font-[500] text-prophet-muted absolute right-0 -top-6";

export const depositStableflowQrWrapClass =
  "relative mx-auto flex items-center justify-center rounded-[12px] border border-prophet-line bg-prophet-panel p-4";

export const depositStableflowQrSkeletonClass =
  "mx-auto h-[200px] w-[200px] rounded-[12px] bg-prophet-action-panel animate-pulse";

export const depositStableflowAddressBoxClass =
  "rounded-[6px] border border-prophet-line bg-prophet-panel";

export const depositStableflowAddressTextClass =
  "m-0 break-all px-4 py-3 text-center text-sm font-[500] text-prophet-foreground";

export const depositStableflowCopyButtonClass = cn(
  "flex w-full items-center justify-center gap-2 border-0 border-t border-prophet-line bg-transparent",
  "px-4 py-3 text-sm font-[500] text-prophet-foreground transition-opacity hover:opacity-80",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const depositStableflowAddressSkeletonClass =
  "mx-4 my-3 h-5 rounded-[4px] bg-prophet-action-panel animate-pulse";

export const depositPendingConfirmButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[8px] bg-black dark:bg-prophet-primary",
  "text-base font-[400] leading-[19px] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const depositTokenSearchWrapClass = cn(
  "relative mb-3 flex h-[34px] w-full items-center rounded-[18px]",
  "border border-prophet-line bg-prophet-panel px-3",
);

export const depositTokenSearchInputClass = cn(
  "min-w-0 flex-1 border-0 bg-transparent py-0 pl-1 pr-2",
  "text-sm font-[400] text-prophet-foreground outline-none placeholder:text-prophet-muted",
  "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
);

export const depositTokenSearchClearClass = cn(
  "flex size-4 shrink-0 items-center justify-center rounded-full bg-prophet-line",
  "text-prophet-muted transition-opacity hover:opacity-80",
);

export const depositTokenSearchEmptyClass = cn(
  "flex min-h-[120px] items-center justify-center px-4 py-8 text-center",
  "text-sm font-[400] text-prophet-muted",
);
