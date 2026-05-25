import type { CSSProperties } from "react";

export const BRACKET_SELECTED_BORDER = "#22C55E";
export const BRACKET_SELECTED_SHADOW =
  "0 0 0 1px #22C55E, 0 2px 10px rgba(34, 197, 94, 0.4)";

export function bracketSelectedStyle(highlighted: boolean): CSSProperties | undefined {
  if (!highlighted) {
    return undefined;
  }

  return {
    borderColor: BRACKET_SELECTED_BORDER,
    boxShadow: BRACKET_SELECTED_SHADOW
  };
}

export function bracketSelectedClassName(highlighted: boolean, base = "border bg-white") {
  return highlighted
    ? `${base} border-2 border-[#22C55E] bg-[#F0FDF4]`
    : `${base} border-[#EBEBEB]`;
}
