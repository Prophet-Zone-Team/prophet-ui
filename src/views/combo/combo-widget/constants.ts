export const COMBO_QUICK_FRACTIONS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 }
] as const;

export const MIN_COMBO_PICKS = 2;

import type { CSSProperties } from "react";

export const comboWidgetShellClassName =
  "flex w-full max-w-full flex-col overflow-hidden rounded-xl border border-[#EBEBEB] lg:max-w-[345px]";

export const comboWidgetShellStyle: CSSProperties = {
  background:
    "linear-gradient(360deg, rgba(45, 151, 243, 0.1) 0%, rgba(177, 68, 255, 0.1) 90.8%), #FFFFFF"
};
