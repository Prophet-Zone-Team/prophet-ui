import { cn } from "@/lib/cn";

export const withdrawFieldLabelClass =
  "text-sm font-[500] leading-[17px] text-prophet-foreground";

export const withdrawInputBoxClass = cn(
  "relative flex h-[57px] w-full items-center justify-between rounded-[6px] border border-[#EBEBEB]",
  "bg-white pl-4 pr-8"
);

export const withdrawSelectorBoxClass = cn(
  "flex h-[57px] w-full cursor-pointer items-center justify-between rounded-[6px]",
  "border border-prophet-line bg-prophet-panel px-4 transition-colors hover:bg-prophet-hover"
);

export const withdrawAmountInputClass = cn(
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-[500] text-prophet-foreground outline-none",
  "placeholder:text-prophet-muted"
);

export const withdrawMaxButtonClass =
  "shrink-0 border-0 bg-transparent p-0 text-base font-[500] text-[#3168FF] hover:opacity-80";
