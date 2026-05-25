import { cn } from "@/lib/cn";

export const walletLoginButtonClass = cn(
  "inline-flex h-10 min-w-[103px] items-center justify-center gap-2 rounded-[20px]",
  "border border-prophet-line bg-white px-4",
  "text-sm font-[457] leading-[17px] text-black",
  "transition-opacity disabled:cursor-wait disabled:opacity-70"
);

export const walletConnectedBarClass = "inline-flex items-center gap-3";

export const walletBalanceLabelClass =
  "text-sm font-[457] leading-[17px] text-prophet-muted";

export const walletBalanceValueClass =
  "text-base font-[457] leading-[19px] text-black";

export const walletDepositButtonClass = cn(
  "inline-flex h-10 min-w-[88px] items-center justify-center rounded-[20px] bg-black px-4",
  "text-sm font-[457] leading-[17px] text-white transition-opacity hover:opacity-90"
);

export const walletMenuTriggerClass = cn(
  "inline-flex h-10 min-w-[70px] items-center justify-center gap-2 rounded-[20px]",
  "bg-white px-3 transition-colors hover:bg-[#fafbfc]"
);

export const walletMenuDividerClass = "h-[31px] w-px shrink-0 bg-prophet-line";

export const walletMenuDropdownClass = cn(
  "absolute right-0 top-[calc(100%+8px)] z-20 min-w-[212px] rounded-xl",
  "border border-prophet-line bg-white p-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
);

export const walletMenuItemClass = cn(
  "flex w-full justify-between items-center gap-3 rounded-lg px-2 py-2.5 text-left",
  "text-sm font-[457] leading-[17px] text-black transition-colors hover:bg-[#f3f8fd]"
);

export const walletMenuLogoutClass = cn(
  walletMenuItemClass,
  "font-[556] text-[#FF674B] hover:bg-[#fff5f2]"
);
