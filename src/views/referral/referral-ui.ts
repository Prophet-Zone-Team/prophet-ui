import { cn } from "@/lib/cn";

export const referralShellClass = "flex flex-col gap-3 pt-[34px] max-md:pt-7 max-sm:pt-6";

export const referralTopGridClass =
  "grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,681px)_minmax(0,401px)] lg:gap-[30px]";

export const referralRewardsCardClass =
  "relative h-[250px] overflow-hidden rounded-[12px] bg-[linear-gradient(180deg,_#2E2E2E_0%,_#0D0D0D_100%)]";

export const referralRewardsLabelClass =
  "text-[16px] leading-[normal] text-white";

export const referralRewardsAmountClass = cn(
  "bg-gradient-to-b from-[#fefcef] to-[#ffcf00] bg-clip-text text-[72px] font-semibold leading-[100%] text-transparent",
  "[text-shadow:0_0_20px_rgba(255,211,80,0.6)]",
);

export const referralRewardsCurrencyClass = cn(
  "bg-gradient-to-b leading-[100%] from-[#fefcef] to-[#ffcf00] bg-clip-text text-[26px] font-medium text-transparent",
);

export const referralRewardsClaimLineClass = "text-[16px] leading-[normal] text-white";

export const referralRewardsHighlightClass = "text-[#ffe164]";

export const referralKickbackCardClass =
  "relative flex h-[250px] flex-col overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel";

export const referralKickbackFooterClass =
  "relative mt-auto flex min-h-[131px] flex-col px-6 pb-6 pt-4";

export const referralKickbackLinkBarClass =
  "flex items-center justify-between gap-3 rounded-[8px] px-0 py-1";

export const referralPrimaryButtonClass = cn(
  "inline-flex h-[50px] w-full items-center justify-center rounded-[12px] bg-prophet-primary text-prophet-primary-foreground text-[16px] font-medium leading-[normal] transition-opacity disabled:cursor-not-allowed disabled:opacity-30 hover:opacity-90",
);

export const referralInviteFriendsButtonClass = cn(
  referralPrimaryButtonClass,
  "dark:bg-[linear-gradient(180deg,#FEFCEF_0%,#FFCF00_100%)] dark:text-black",
);

export const referralInviteButtonClass = referralPrimaryButtonClass;

export const referralClaimButtonClass = cn(
  referralPrimaryButtonClass,
  "w-[152px] shrink-0 max-md:w-full",
);

export const referralActivityPanelClass =
  "flex min-h-[608px] flex-col rounded-[12px] border border-prophet-line bg-prophet-panel";

export const referralSummaryBarClass =
  "relative grid min-h-[112px] rounded-t-[12px] grid-cols-1 gap-4 border-b border-prophet-line bg-prophet-action-panel px-[30px] py-6 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center";

export const referralSummaryStatValueClass = "text-[26px] font-medium leading-none text-prophet-foreground";

export const referralSummaryStatValueMutedClass =
  "text-[26px] font-medium leading-none text-prophet-foreground opacity-30";

export const referralSummaryStatLabelClass = "mt-2 text-[14px] leading-[normal] text-prophet-muted";

export const referralSummaryDividerClass =
  "absolute bottom-6 top-6 hidden w-px bg-prophet-line sm:block";

export const referralEmptyStateClass =
  "flex flex-col items-center justify-center gap-6 px-[30px] py-16";

export const referralEmptyMessageClass = "text-[14px] leading-[normal] text-prophet-muted";

export const referralEmptyInviteButtonClass = cn(
  referralInviteFriendsButtonClass,
  "w-[233px]",
);

export const referralGridTemplateColumns =
  "minmax(0,1.1fr) minmax(0,0.9fr) minmax(0,0.7fr) minmax(0,1.4fr) minmax(0,0.8fr) minmax(0,0.7fr)";

export const referralEarningsCellClass = "text-prophet-green";

export const referralIconStrokeClass =
  "fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]";

export const englandFlagClass = cn(
  "relative inline-grid size-[23px] shrink-0 overflow-hidden rounded-full bg-prophet-panel",
  "shadow-[0_1px_5px_rgba(32,72,122,0.14)]",
  "before:absolute before:left-1/2 before:top-1/2 before:h-[5px] before:w-[130%]",
  "before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-sm before:bg-[#d51d36]",
  "after:absolute after:left-1/2 after:top-1/2 after:h-[130%] after:w-[5px]",
  "after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-sm after:bg-[#d51d36]",
);

export const emojiFlagClass =
  "inline-grid size-[23px] shrink-0 place-items-center rounded-full bg-prophet-panel text-xl shadow-[0_1px_5px_rgba(32,72,122,0.14)]";

export {
  inviteModalMobileShellClass,
  inviteModalShellClass,
  inviteShareCardOuterClass,
} from "@/components/share/share-modal-ui";

export const inviteShareCardClass = cn(
  "relative shrink-0 overflow-hidden rounded-[12px]",
  "shadow-[0_0_10px_rgba(0,0,0,0.2)]",
);

export const inviteShareCardTitleClass = cn(
  "bg-gradient-to-b from-white from-[21.825%] to-[#bbd0fd] bg-clip-text text-left text-[26px] font-semibold leading-[normal] text-transparent",
);

export const inviteShareCardProfitClass = "text-[#bbd0fd]";

export const inviteShareCardFunderClass =
  "text-left text-[11px] font-semibold leading-[1.3] text-[#7599ff]";

export const inviteShareCardInviteClass =
  "text-left text-[10px] font-light leading-[1.3] tracking-[-0.7px] text-white";

export const inviteShareCardQrWrapClass =
  "absolute bottom-[16px] right-[16px] z-20 rounded-[4px] border border-black bg-prophet-panel p-[2px]";

export const inviteLinkRowShellClass =
  "rounded-[12px] border border-prophet-line bg-prophet-panel px-4 py-4";

export const inviteActionButtonClass = cn(
  "inline-flex h-[52px] w-full items-center justify-center rounded-[12px] border border-prophet-line bg-prophet-panel",
  "text-prophet-muted transition-colors hover:bg-prophet-hover focus-visible:bg-prophet-hover",
  "disabled:cursor-not-allowed disabled:opacity-30",
);
