import { cn } from "@/lib/cn";
import { fundingModalCardClass } from "@/views/portfolio/shared/funding-modal-shell";

export const privateTopupPageClass = "min-h-[calc(100vh-44px)] bg-prophet-base px-4 pb-16 pt-8";

export const privateTopupCardClass = cn(
  "rounded-[20px] border border-prophet-line bg-prophet-panel",
  "shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]",
);

export const privateTopupAccountCardClass = cn(
  "rounded-[20px] border border-prophet-line bg-black",
  "shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]",
);

export const privateTopupWalletCardClass = cn(
  privateTopupCardClass,
  "relative flex min-h-[240px] flex-col p-6",
);

export const privateTopupAccountInnerClass =
  "relative flex min-h-[240px] flex-col p-6";

export const privateTopupChangeLinkClass =
  "text-sm font-[400] text-[#3168ff] transition-opacity hover:opacity-80";

export const privateTopupPrimaryButtonClass = cn(
  "flex h-[55px] w-full items-center justify-center rounded-[12px] bg-black dark:bg-prophet-primary",
  "text-base font-[400] leading-[19px] text-white transition-opacity hover:opacity-90",
);

export const privateTopupTopUpButtonClass = cn(
  "flex h-[50px] min-w-[115px] items-center justify-center rounded-[12px] bg-prophet-panel",
  "text-base font-[400] text-prophet-foreground transition-opacity hover:opacity-90",
);

export const privateTopupTopUpButtonDisabledClass =
  "pointer-events-none opacity-30";

export const privateTopupBalanceLargeClass =
  "text-[42px] font-[500] leading-none text-prophet-foreground";

export const privateTopupPrivateBalanceLargeClass =
  "text-[42px] font-[500] leading-none text-white";

export const privateTopupSectionLabelClass = "text-sm font-[500] text-prophet-muted";

export const privateTopupSecureIconWrapClass = cn(
  "relative flex size-[24px] border-[2px] bg-[#616161] border-prophet-panel shrink-0 items-center justify-center rounded-full",
  "ring-4 ring-white/10",
);

export const privateTopupFundingWalletRowClass = cn(
  "flex w-full items-center justify-between rounded-[6px] border border-prophet-line",
  "bg-prophet-panel px-4 py-3",
);

export const privateTopupModalAmountInputWrapClass =
  "mx-auto flex w-1/2 min-w-[200px] max-w-[250px] items-baseline";

export const privateTopupModalAmountPrefixClass =
  "shrink-0 text-[36px] font-[500] leading-[43px] text-prophet-foreground";

export const privateTopupModalAmountInputClass = cn(
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-[36px] font-[500] leading-[43px] text-prophet-foreground",
  "outline-none placeholder:text-[#c8c8c8]"
);

export const privateTopupGetStartedLinkClass = cn(
  "inline-flex items-center gap-2 text-base font-[400] text-prophet-foreground",
  "transition-opacity hover:opacity-70",
);

export const privateTopupOnboardingCardClass = cn(
  fundingModalCardClass,
  "flex flex-col overflow-hidden",
);

export const privateTopupIntroConnectedCardClass = cn(
  "rounded-[12px] border border-prophet-line bg-prophet-panel",
  "shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]",
);

export const privateTopupWarningBannerClass = cn(
  "flex items-center gap-2 rounded-[6px] bg-[#fdd357]/20 px-3 py-2",
  "text-[14px] font-[400] leading-normal text-[#d1a00f]",
);

export const privateTopupInfoBannerClass = cn(
  "rounded-[8px] bg-[#e3e9ff] dark:bg-[rgba(49,104,255,0.15)] px-4 py-3 text-center",
  "text-[14px] font-[400] leading-normal text-[#007aff]",
);

export const privateTopupIntroFooterCancelClass = cn(
  "inline-flex h-[50px] w-[210px] items-center justify-center rounded-[8px]",
  "border border-prophet-muted bg-prophet-panel text-[16px] font-[400] text-prophet-foreground",
  "transition-opacity hover:opacity-80",
);

export const privateTopupIntroFooterProceedClass = cn(
  "inline-flex h-[50px] w-[210px] items-center justify-center gap-1 rounded-[8px]",
  "bg-prophet-primary text-prophet-primary-foreground text-[16px] font-[400] transition-opacity hover:opacity-90",
  "disabled:opacity-30 disabled:cursor-not-allowed",
);

export const privateTopupGuideFooterCancelClass = cn(
  "inline-flex h-[38px] min-w-[107px] items-center justify-center rounded-[8px]",
  "border border-prophet-muted bg-prophet-panel px-4 text-[16px] font-[400] text-prophet-foreground",
  "transition-opacity hover:opacity-80",
);

export const privateTopupGuideFooterProceedClass = cn(
  "inline-flex h-[38px] min-w-[107px] items-center justify-center gap-1 rounded-[8px]",
  "bg-prophet-primary px-4 text-[16px] font-[400] text-white transition-opacity hover:opacity-90",
  "disabled:opacity-30 disabled:cursor-not-allowed",
);

export const privateTopupTokenSearchWrapClass = cn(
  "relative mb-3 flex h-[34px] w-full items-center rounded-[18px]",
  "border border-prophet-line bg-prophet-panel px-3",
);

export const privateTopupTokenSearchInputClass = cn(
  "min-w-0 flex-1 border-0 bg-transparent py-0 pl-1 pr-2",
  "text-sm font-[400] text-prophet-foreground outline-none placeholder:text-prophet-muted",
  "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
);

export const privateTopupTokenSearchClearClass = cn(
  "flex size-4 shrink-0 items-center justify-center rounded-full bg-prophet-line",
  "text-prophet-muted transition-opacity hover:opacity-80",
);

export const privateTopupTokenSearchEmptyClass = cn(
  "flex min-h-[120px] items-center justify-center px-4 py-8 text-center",
  "text-sm font-[400] text-prophet-muted",
);
