export const COMBO_MOBILE_WIDGET_BOTTOM_OFFSET_PX = 9;
export const COMBO_MOBILE_WIDGET_HORIZONTAL_PADDING_PX = 10;
export const COMBO_MOBILE_PAGE_SCROLL_BUFFER_PX = 16;

export const COMBO_MOBILE_EMPTY_HEIGHT_PX = 112;
export const COMBO_MOBILE_SELECTED_BASE_HEIGHT_PX = 214;
export const COMBO_MOBILE_PICK_ROW_EXTRA_HEIGHT_PX = 54;

export const COMBO_MOBILE_QUICK_AMOUNTS = [10, 50, 100] as const;

export const comboMobileWidgetShellStyle = {
  background:
    "linear-gradient(360deg, rgba(45, 151, 243, 0.1) 0%, rgba(177, 68, 255, 0.1) 100%), #FFFFFF"
} as const;

export const comboMobileBidSheetShellStyle = {
  background:
    "linear-gradient(360deg, rgba(45, 151, 243, 0) 0%, rgba(177, 68, 255, 0.1) 100%), #FFFFFF"
} as const;

export function getComboMobileReserveHeight(pickCount: number): number {
  if (pickCount === 0) {
    return COMBO_MOBILE_EMPTY_HEIGHT_PX;
  }

  if (pickCount <= 2) {
    return COMBO_MOBILE_SELECTED_BASE_HEIGHT_PX;
  }

  return (
    COMBO_MOBILE_SELECTED_BASE_HEIGHT_PX +
    (pickCount - 2) * COMBO_MOBILE_PICK_ROW_EXTRA_HEIGHT_PX
  );
}
