import { cn } from "@/lib/cn";

export const teamPageClass =
  "mx-auto max-w-[1440px] px-4 pb-10 pt-2 sm:px-6";

export const teamPanelClass = cn(
  "overflow-hidden rounded-[12px] border border-prophet-line bg-white"
);

export const teamPanelHeadClass =
  "flex flex-wrap items-center justify-between gap-2 border-b border-prophet-line px-4 py-3";

export const teamPanelTitleClass = "m-0 text-base font-[500] text-black sm:text-lg";

export const teamPanelBadgeClass = "text-xs font-[500] text-prophet-muted";

export const teamHeroCardClass = cn(
  "rounded-[12px] border border-prophet-line bg-gradient-to-br from-[#f5f9ff] to-white p-5 shadow-prophet",
  "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1.2fr)] lg:items-center"
);

export const teamHeroMetricsClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-4";

export const teamDossierStripClass =
  "grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_345px]";

export const teamMainGridClass =
  "flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start mt-4";

export const teamMainColumnClass = "order-2 flex min-w-0 flex-col gap-4 xl:order-1";

export const teamSidebarClass =
  "order-1 flex min-w-0 flex-col gap-4 xl:order-2 xl:sticky xl:top-14";

export const teamTwoUpClass =
  "grid grid-cols-1 gap-4 lg:grid-cols-2";

export const teamMetricToneClass = (tone?: "up" | "down") =>
  cn(
    "flex flex-col gap-0.5 rounded-lg border border-prophet-line/80 bg-[#fafbfc] px-3 py-2",
    tone === "up" && "border-prophet-green/30",
    tone === "down" && "border-prophet-red/30"
  );

export const teamMetricValueClass = (tone?: "up" | "down") =>
  cn(
    "text-sm font-[500] text-black",
    tone === "up" && "text-prophet-green",
    tone === "down" && "text-prophet-red"
  );

export const teamMiniGridClass = "grid grid-cols-2 gap-2 sm:grid-cols-3";

export const teamOpenTradeButtonClass = cn(
  "inline-flex h-9 items-center justify-center rounded-lg border border-prophet-line bg-white px-4",
  "text-sm font-[500] text-black transition-colors hover:bg-[#fafbfc]"
);
