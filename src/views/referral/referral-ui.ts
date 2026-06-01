import { cn } from "@/lib/cn";

export const referralShellClass = "pt-[34px] max-md:pt-7 max-sm:pt-6";

export const referralPanelClass = cn(
  "rounded-prophet border border-prophet-line bg-white shadow-prophet backdrop-blur-2xl",
);

export const referralSectionTitleClass =
  "mb-1.5 text-base font-semibold leading-[1.2] text-prophet-navy";

export const referralHelperClass = "m-0 text-xs leading-snug text-prophet-muted";

export const referralHeroClass = cn(
  "mb-[22px] flex items-start justify-between gap-7",
  "max-md:flex-col max-md:gap-[18px]",
);

export const referralHeroTitleClass = "text-[34px] font-semibold leading-none text-prophet-navy";

export const referralHeroSubtitleClass = "m-0 mt-2 text-sm leading-snug text-prophet-muted";

export const referralHeroRightClass = cn(
  "flex items-center gap-3.5 text-right",
  "max-md:w-full max-md:flex-wrap max-md:justify-between max-md:text-left",
);

export const referralBalancePillClass = cn(
  "flex min-w-[150px] items-center gap-2.5 rounded-prophet border border-prophet-line",
  "bg-white/80 px-3.5 py-2.5 text-left shadow-prophet max-sm:w-full",
);

export const referralBalanceIconClass = cn(
  "grid size-[34px] shrink-0 place-items-center rounded-prophet text-[17px] font-semibold leading-none text-white",
  "bg-gradient-to-br from-[#125afc] to-[#0d69ff] shadow-[0_10px_22px_rgba(18,90,252,0.15)]",
);

export const referralBalanceLabelClass = "block text-[10px] leading-tight text-prophet-muted";

export const referralBalanceValueClass = "block text-[15px] leading-tight text-[#0b1429]";

export const referralLinkCardClass = cn(referralPanelClass, "mb-3.5 p-[18px]");

export const referralLinkRowClass = cn(
  "mt-4 grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-prophet border border-prophet-line",
  "bg-[#f5f9ff] p-2.5 max-sm:grid-cols-[38px_1fr] max-sm:[&_button]:col-span-full max-sm:[&_button]:w-full",
);

export const referralLinkCodeClass =
  "break-all font-mono text-sm font-semibold leading-tight text-[#111b31]";

export const referralMetricGridClass = cn(
  "mb-3.5 grid grid-cols-4 gap-2.5 max-md:grid-cols-2 max-sm:grid-cols-1",
);

export const referralMetricCardClass = cn(
  referralPanelClass,
  "grid min-h-[104px] grid-cols-[34px_1fr] gap-3 p-4 content-start",
);

export const referralMetricCardHighlightClass =
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(246,251,255,0.8)),radial-gradient(circle_at_90%_16%,rgba(18,90,252,0.08),transparent_36%)]";

export const referralMetricIconClass = cn(
  "grid size-[34px] shrink-0 place-items-center rounded-prophet text-[17px] font-semibold text-white",
  "bg-gradient-to-br from-[#125afc] to-[#0d69ff] shadow-[0_10px_22px_rgba(18,90,252,0.15)]",
);

export const referralMetricIconGoldClass = cn(
  "bg-gradient-to-br from-[#d89b22] to-[#f3c763] shadow-[0_10px_22px_rgba(216,155,34,0.18)]",
);

export const referralMetricLabelClass = "block text-xs leading-tight text-prophet-muted";

export const referralMetricValueClass = "my-2 block text-2xl leading-none text-prophet-navy";

export const referralMetricHelperClass = "block text-[11px] leading-snug text-prophet-muted";

export const referralProgressTrackClass =
  "my-[11px] mb-2 h-[7px] overflow-hidden rounded-full bg-prophet-line";

export const referralProgressFillClass =
  "h-full rounded-full bg-gradient-to-r from-[#20c2e4] to-[#125afc]";

export const referralSuccessLineClass =
  "flex items-center gap-1.5 text-[11px] font-semibold text-prophet-green";

export const referralSuccessDotClass =
  "size-[7px] shrink-0 rounded-full bg-current shadow-[0_0_0_4px_rgba(101,175,20,0.1)]";

export const referralEarnCardClass = cn(referralPanelClass, "mb-3.5 p-[18px]");

export const referralEarnFormulaClass = cn(
  "mt-3 grid grid-cols-[1fr_28px_1fr_28px_1fr_28px_1fr] items-center gap-2.5 rounded-prophet border",
  "border-prophet-line bg-[rgba(247,251,255,0.9)] p-3.5 text-center",
  "max-md:grid-cols-1 max-md:text-left",
);

export const referralFormulaPartLabelClass = "mb-1 block text-[10px] text-prophet-muted";

export const referralFormulaPartValueClass = "block text-lg leading-none text-prophet-navy";

export const referralFormulaMarkClass = "text-lg font-semibold text-prophet-muted max-md:hidden";

export const referralEarnFootClass = cn(
  "mt-3 flex flex-wrap items-center justify-between gap-4 text-[11px] leading-snug text-prophet-muted",
  "max-sm:flex-col max-sm:items-start",
);

export const referralEarnLinkClass = "shrink-0 font-semibold text-[#125afc] no-underline";

export const referralActivityCardClass = cn(referralPanelClass, "px-3.5 pb-[18px] pt-3.5");

export const referralTableWrapClass = "mt-2.5 overflow-x-auto";

export const referralTableClass = "w-full min-w-[930px] border-collapse text-[11px]";

export const referralTableHeadClass =
  "bg-[rgba(247,251,255,0.82)] px-2 py-2 text-left font-semibold text-prophet-muted";

export const referralTableCellClass =
  "border-b border-prophet-line px-2 py-2 text-left whitespace-nowrap text-[#19243a]";

export const referralTableBodyClass = "[&_tr:last-child_td]:border-b-0";

export const referralOrderIdClass = "font-semibold text-[#125afc]";

export const referralStatusCompleteClass = "font-semibold text-prophet-green";

export const referralClaimRowClass =
  "mt-4 flex flex-wrap items-center justify-center gap-[18px] max-sm:flex-col max-sm:items-stretch";

export const referralClaimMetaClass = "text-xs leading-snug text-prophet-muted";

export const referralIconStrokeClass = "fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]";

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
