import { cn } from "@/lib/cn";

export const depositSectionLabelClass = "text-sm font-[556] leading-[17px] text-black";

export const depositConnectedRowClass = cn(
  "flex w-full cursor-pointer items-center justify-between rounded-[6px] border border-[#EBEBEB]",
  "bg-white px-4 py-4 text-left transition-colors hover:bg-[#fafbfc]"
);

export const depositTokenRowClass = cn(
  "flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors",
  "hover:bg-[#f4f4f4]"
);

export const depositTokenRowSelectedClass = "bg-[#f4f4f4]";

export const depositTokenRowDisabledClass = "cursor-not-allowed opacity-30 hover:bg-transparent";

export const depositAmountInputClass = cn(
  "w-full border-0 bg-transparent p-0 text-center text-[36px] font-[556] leading-[43px] text-black",
  "outline-none placeholder:text-[#c8c8c8]"
);

export const depositPercentButtonClass = cn(
  "flex h-[30px] min-w-[50px] items-center justify-center rounded-[8px] border border-[#EBEBEB]",
  "bg-white px-3 text-sm font-[457] text-[#909090] transition-colors hover:border-black hover:text-black"
);

export const depositTransferBarClass =
  "flex items-center justify-between gap-3 rounded-[6px] bg-[#f4f4f4] px-4 py-3";

export const depositDetailRowClass =
  "flex items-center justify-between py-3 text-sm last:border-b-0 gap-2";

export const depositBreakdownBoxClass = "rounded-[6px] bg-[#f4f4f4] p-4";

export const depositBreakdownRowClass =
  "flex items-center justify-between py-1 text-sm text-[#909090]";
