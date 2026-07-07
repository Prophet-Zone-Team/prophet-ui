import { comboShellBackground } from "@/views/combo/combo-ui";

export const positionCardModalShellClassName =
  "flex w-full max-w-none flex-col overflow-hidden rounded-none border-0 md:w-[500px] md:max-w-[calc(100vw-2rem)] md:rounded-[12px] md:border md:border-prophet-line";

export const positionCardModalShellStyle = {
  background: comboShellBackground("modal")
} as const;

export const POSITION_CARD_MODAL_PICK_CONNECTOR_HEIGHT_PX = 28;
