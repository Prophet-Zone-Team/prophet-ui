import { cn } from "@/lib/cn";

export const migratePromptHeroClass =
  "relative h-[114px] w-full overflow-hidden rounded-t-[20px]";

export const migrateAccountCardClass = cn(
  "flex items-start justify-between gap-3 rounded-[6px] border border-[#ebebeb]",
  "bg-white px-3.5 py-4"
);

export const migrateAccountMetaClass = "min-w-0 flex-1";

export const migrateAccountLabelClass = "text-base font-[500] leading-[19px] text-black";

export const migrateAccountAddressClass =
  "mt-1 break-all text-xs font-[500] leading-[14px] text-[#909090]";

export const migrateAccountBalanceClass =
  "shrink-0 text-base font-[500] leading-[19px] text-black";

export const migrateInfoBannerClass =
  "rounded-[8px] bg-[#e3e9ff] px-2.5 py-2.5 text-sm font-[400] leading-[normal] text-[#3168ff]";

export const migrateMinimumNoticeClass =
  "flex items-center gap-2 rounded-[6px] bg-[#fdd357]/20 px-3 py-2";

export const migrateMinimumNoticeTextClass =
  "text-sm font-[400] leading-[normal] text-[#d1a00f]";

export const migrateSecondaryButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[8px] border border-[#909090]",
  "bg-white text-base font-[400] text-black transition-opacity hover:opacity-90"
);

export const migratePrimaryButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[8px] bg-black",
  "text-base font-[400] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
);

export const migrateMenuBannerClass = cn(
  "relative mb-2 flex h-[60px] w-full cursor-pointer items-center justify-between overflow-hidden",
  "rounded-[8px] px-3 text-left transition-opacity hover:opacity-90",
  "bg-[url('/migrate/bg-card-2.png')] bg-cover bg-center bg-no-repeat"
);

export const migrateDepositEntryClass = cn(
  "relative flex h-[72px] w-full cursor-pointer items-center justify-between overflow-hidden",
  "rounded-[8px] px-4 text-left transition-opacity hover:opacity-90",
  "bg-[url('/migrate/bg-card-3.png')] bg-cover bg-center bg-no-repeat"
);

export const migrateAddressRowClass =
  "flex items-start justify-between gap-2 py-2 text-sm text-black";

export const migrateAddressRowValueClass =
  "w-[200px] break-all text-right text-sm font-[500] text-black shrink-0";

export const migrateTransferBarClass =
  "relative rounded-[6px] bg-[#f4f4f4] px-3 py-4 grid grid-cols-[1fr_36px_1fr] gap-2";

export const migrateTransferSideClass = "flex min-w-0 items-center gap-2";

export const migrateTransferLabelClass = "text-sm font-[500] text-black";

export const migrateTransferSubLabelClass = "text-[10px] font-[500] text-[#909090]";

export const migratePercentButtonClass = cn(
  "flex h-[30px] min-w-[50px] items-center justify-center rounded-[8px] border border-[#EBEBEB]",
  "bg-white px-3 text-sm font-[400] text-[#909090] transition-colors hover:border-black hover:text-black"
);

export const migrateAmountInputWrapClass =
  "mx-auto flex w-1/2 min-w-[200px] max-w-[250px] items-baseline";

export const migrateAmountInputClass = cn(
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-[36px] font-[500] leading-[43px] text-black",
  "outline-none placeholder:text-[#c8c8c8]"
);

export const migrateSectionLabelClass = "text-sm font-[500] text-black";

export const migratePromptBodyClass = "px-[30px] pb-[30px] pt-5";

export const migrateSetupBodyClass = "flex min-h-0 flex-1 flex-col pb-[30px]";

export const migrateConfirmBodyClass = "flex min-h-0 flex-1 flex-col pb-[30px]";

export const migratePromptActionsClass =
  "grid grid-cols-1 gap-3 sm:grid-cols-2";
