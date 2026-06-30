import { cn } from "@/lib/cn";

export const bindTgCardClass = cn(
  "relative flex w-[394px] h-[444px] flex-col overflow-hidden rounded-[20px]",
  "border border-prophet-line bg-prophet-panel shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
);

export const bindTgPrimaryButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[10px] bg-prophet-primary text-prophet-primary-foreground",
  "text-base font-[400] leading-[19px] text-white transition-opacity hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-100"
);

export const bindTgPrimaryMutedButtonClass = cn(
  bindTgPrimaryButtonClass,
  "bg-[#BDBDBD] hover:opacity-100"
);

export const bindTgSecondaryButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[10px]",
  "border border-prophet-line bg-prophet-panel text-base font-[400] leading-[19px] text-prophet-foreground",
  "transition-opacity hover:opacity-90"
);

export const bindTgSuccessButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[#22C55E]",
  "text-base font-[400] leading-[19px] text-white transition-opacity hover:opacity-90"
);

export const bindTgDisconnectButtonClass = cn(
  "flex h-[50px] w-full items-center justify-center rounded-[10px]",
  "border border-[#F87171] bg-prophet-panel text-base font-[400] leading-[19px] text-[#F87171]",
  "transition-opacity hover:opacity-90"
);
