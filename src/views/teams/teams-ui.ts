import { cn } from "@/lib/cn";

export const teamsPageClass = "mx-auto max-w-[1112px] px-4 py-8 sm:px-6";

export const teamsHeroTitleClass =
  "m-0 text-[40px] font-[500] leading-[0.95] text-black sm:text-[48px]";

export const teamsHeroCopyClass = "m-0 max-w-2xl text-sm leading-6 text-prophet-muted";

export const teamsPanelClass = cn(
  "min-w-0 rounded-[12px] border border-prophet-line bg-white p-[18px] shadow-prophet"
);

export const teamsFeaturedCardClass = cn(
  "flex flex-col gap-4 rounded-[12px] border border-prophet-line",
  "bg-gradient-to-br from-[#f5f9ff] to-white p-5 shadow-prophet"
);

export const teamsDirectoryRowClass = cn(
  "rounded-xl border border-[#EBEBEB] px-4 py-3 transition-colors hover:border-[#d0d0d0]",
  "bg-[linear-gradient(90deg,rgba(220,255,181,0.12)_0%,rgba(255,255,255,0.95)_42%),#FFF]"
);

export const teamsDirectoryGridClass =
  "grid items-center gap-x-4 gap-y-3 max-xl:grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_minmax(0,0.75fr)_minmax(0,0.65fr)_minmax(0,0.85fr)_minmax(0,0.95fr)_auto]";

export const teamsDirectoryHeadClass =
  "hidden gap-x-4 px-4 pb-2 text-[10px] font-[500] uppercase tracking-wide text-prophet-muted xl:grid xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_minmax(0,0.75fr)_minmax(0,0.65fr)_minmax(0,0.85fr)_minmax(0,0.95fr)_auto]";

export const teamsMetricLabelClass = "text-xs font-normal leading-[14px] text-[#909090]";

export const teamsDetailButtonClass = cn(
  "inline-flex h-9 w-[83px] items-center justify-center rounded-lg border border-[#909090]",
  "bg-white text-sm font-[500] leading-[17px] text-[#18110F] transition-colors hover:bg-[#fafbfc]"
);

export const teamsBidButtonClass = cn(
  "inline-flex h-9 w-[83px] items-center justify-center gap-1 rounded-lg bg-[#18110F]",
  "text-sm font-[500] leading-[17px] text-white transition-opacity hover:opacity-90"
);
