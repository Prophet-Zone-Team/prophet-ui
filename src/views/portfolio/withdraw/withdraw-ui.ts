import { cn } from "@/lib/cn";

export const withdrawFieldLabelClass = "text-sm font-[556] leading-[17px] text-black";

export const withdrawInputBoxClass = cn(
  "flex h-[57px] w-full items-center justify-between rounded-[6px] border border-[#EBEBEB]",
  "bg-white px-4"
);

export const withdrawSelectorBoxClass = cn(
  "flex h-[57px] w-full cursor-pointer items-center justify-between rounded-[6px]",
  "border border-[#EBEBEB] bg-white px-4 transition-colors hover:bg-[#fafbfc]"
);

export const withdrawAmountInputClass = cn(
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-[556] text-black outline-none",
  "placeholder:text-[#909090]"
);

export const withdrawMaxButtonClass =
  "shrink-0 border-0 bg-transparent p-0 text-base font-[556] text-[#3168FF] hover:opacity-80";
