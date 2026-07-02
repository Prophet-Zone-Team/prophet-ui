import { cn } from "@/lib/cn";

export const groupDetailPanelClass = cn(
  "overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel"
);

export const groupDetailCardClass = cn(
  "rounded-xl border border-prophet-line bg-prophet-panel"
);

export const groupDetailDividerClass = "bg-prophet-line";

export const groupDetailPopoverClass = cn(
  "flex h-[46px] w-[118px] items-center justify-center rounded-[12px]",
  "border border-prophet-line bg-prophet-panel px-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
);
