import type { CSSProperties } from "react";

import { comboShellBackground } from "@/views/combo/combo-ui";

export const COMBO_QUICK_FRACTIONS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 }
] as const;

export const MIN_COMBO_PICKS = 2;

export const comboWidgetShellClassName =
  "flex w-full max-w-full flex-col overflow-hidden rounded-xl border border-prophet-line lg:max-w-[345px]";

export const comboWidgetShellStyle: CSSProperties = {
  background: comboShellBackground("widget")
};
