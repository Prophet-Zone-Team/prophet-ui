import { cn } from "@/lib/cn";

export const inviteModalShellClass = cn(
  "w-full md:w-[492px] rounded-[20px] border border-prophet-line bg-prophet-panel p-[30px]",
  "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
);

export const inviteModalMobileShellClass =
  "overflow-y-auto px-3 pb-[100px] md:pb-6 pt-[45px]";

export const inviteShareCardOuterClass = cn(
  "mx-auto box-border w-fit max-w-full overflow-visible p-1.5",
);
