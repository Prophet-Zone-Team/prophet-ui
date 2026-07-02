import { cn } from "@/lib/cn";

export const walletLoginButtonClass = cn(
  "inline-flex h-10 min-w-[103px] items-center justify-center gap-2 rounded-[20px]",
  "border border-prophet-line bg-prophet-primary px-4",
  "text-sm font-[400] leading-[17px] text-prophet-primary-foreground",
  "transition-opacity disabled:cursor-wait disabled:opacity-70"
);

export const walletConnectedBarClass = "inline-flex items-center gap-3";

export const walletBalanceLabelClass =
  "text-[14px] font-[400] leading-[17px] text-prophet-muted";

export const walletBalanceValueClass =
  "text-[16px] font-[400] leading-[19px] text-prophet-foreground";

export const walletDepositButtonClass = cn(
  "relative inline-flex h-[40px] min-w-[88px] items-center justify-center rounded-[20px] bg-prophet-primary text-center",
  "text-[14px] font-[400] leading-[17px] text-prophet-primary-foreground transition-opacity hover:opacity-90"
);

export const walletMenuTriggerClass = cn(
  "inline-flex h-10 min-w-[70px] items-center justify-center gap-2 rounded-[20px]",
  "px-3 transition-colors hover:bg-prophet-base"
);

export const walletMenuDividerClass = "h-[31px] w-px shrink-0 bg-prophet-line";

export const walletMenuDropdownClass = cn(
  "absolute right-0 top-[calc(100%+8px)] z-20 min-w-[212px] rounded-xl",
  "border border-prophet-line bg-prophet-panel p-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
);

export const walletMenuItemClass = cn(
  "flex w-full justify-between items-center gap-3 rounded-lg px-1.5 py-2.5 text-left",
  "text-[14px] font-[400] leading-[17px] text-prophet-foreground transition-colors hover:bg-prophet-hover"
);

export const walletMenuLogoutClass = cn(
  "w-full flex items-center px-1.5 py-2.5 gap-2 text-[14px] font-[400] leading-[17px] text-[#FF674B] hover:bg-[#fff5f2] dark:hover:bg-[#2a201e]"
);
