import { cn } from "@/lib/cn";

export const referralShellClass = "flex flex-col gap-3 pt-[34px] max-md:pt-7 max-sm:pt-6";

export const referralTopGridClass =
  "grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,681px)_minmax(0,401px)] lg:gap-[30px]";

export const referralRewardsCardClass =
  "relative h-[250px] overflow-hidden rounded-[12px] bg-[linear-gradient(180deg,_#2E2E2E_0%,_#0D0D0D_100%)]";

export const referralRewardsLabelClass =
  "text-[16px] leading-[normal] text-white";

export const referralRewardsAmountClass = cn(
  "bg-gradient-to-b from-[#fefcef] to-[#ffcf00] bg-clip-text text-[72px] font-semibold leading-none text-transparent",
  "[text-shadow:0_0_20px_rgba(255,211,80,0.6)]",
);

export const referralRewardsCurrencyClass = cn(
  "bg-gradient-to-b from-[#fefcef] to-[#ffcf00] bg-clip-text text-[26px] font-medium leading-none text-transparent",
);

export const referralRewardsClaimLineClass = "text-[16px] leading-[normal] text-white";

export const referralRewardsHighlightClass = "text-[#ffe164]";

export const referralKickbackCardClass =
  "relative flex h-[250px] flex-col overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white";

export const referralKickbackFooterClass =
  "relative mt-auto flex min-h-[131px] flex-col px-6 pb-6 pt-4 bg-[linear-gradient(180deg,#FFFBE0_9.13%,#FFCF00_100%)]";

export const referralKickbackLinkBarClass =
  "flex items-center justify-between gap-3 rounded-[8px] px-0 py-1";

export const referralPrimaryButtonClass = cn(
  "inline-flex h-[50px] w-full items-center justify-center rounded-[12px] bg-black text-[16px] font-medium leading-[normal] text-white transition-opacity hover:opacity-90",
);

export const referralInviteButtonClass = referralPrimaryButtonClass;

export const referralClaimButtonClass = cn(
  referralPrimaryButtonClass,
  "w-[152px] shrink-0 max-md:w-full",
);

export const referralClaimButtonDisabledClass = "opacity-30";

export const referralActivityPanelClass =
  "flex min-h-[608px] flex-col rounded-[12px] border border-[#EBEBEB] bg-white";

export const referralSummaryBarClass =
  "relative grid min-h-[112px] grid-cols-1 gap-4 border-b border-[#EBEBEB] bg-[#fafbfc] px-[30px] py-6 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center";

export const referralSummaryStatValueClass = "text-[26px] font-medium leading-none text-black";

export const referralSummaryStatValueMutedClass =
  "text-[26px] font-medium leading-none text-black opacity-30";

export const referralSummaryStatLabelClass = "mt-2 text-[14px] leading-[normal] text-[#909090]";

export const referralSummaryDividerClass =
  "absolute bottom-6 top-6 hidden w-px bg-[#EBEBEB] sm:block";

export const referralEmptyStateClass =
  "flex flex-col items-center justify-center gap-6 px-[30px] py-16";

export const referralEmptyMessageClass = "text-[14px] leading-[normal] text-[#909090]";

export const referralEmptyInviteButtonClass = cn(
  referralPrimaryButtonClass,
  "w-[233px]",
);

export const referralGridTemplateColumns =
  "minmax(0,1.1fr) minmax(0,0.9fr) minmax(0,0.7fr) minmax(0,1.4fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.7fr)";

export const referralEarningsCellClass = "text-prophet-green";

export const referralIconStrokeClass =
  "fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]";

export const englandFlagClass = cn(
  "relative inline-grid size-[23px] shrink-0 overflow-hidden rounded-full bg-white",
  "shadow-[0_1px_5px_rgba(32,72,122,0.14)]",
  "before:absolute before:left-1/2 before:top-1/2 before:h-[5px] before:w-[130%]",
  "before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-sm before:bg-[#d51d36]",
  "after:absolute after:left-1/2 after:top-1/2 after:h-[130%] after:w-[5px]",
  "after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-sm after:bg-[#d51d36]",
);

export const emojiFlagClass =
  "inline-grid size-[23px] shrink-0 place-items-center rounded-full bg-white text-xl shadow-[0_1px_5px_rgba(32,72,122,0.14)]";
