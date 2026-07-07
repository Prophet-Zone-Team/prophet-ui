import { comboShellBackground } from "@/views/combo/combo-ui";

export const positionCardShellClassName =
  "relative flex h-[210px] w-full md:w-[280px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-prophet-line sm:w-[336px]";

export const positionCardShellStyle = {
  background: comboShellBackground("position")
} as const;

export const POSITION_PICK_CONNECTOR_HEIGHT_PX = 21.5;
