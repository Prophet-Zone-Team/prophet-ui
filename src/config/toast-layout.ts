/** Vertical offset so toasts and event overlays sit below the fixed app header. */
export const TOAST_TOP_OFFSET_PX = 70;

export function getToastTopOffset(): string {
  return `${TOAST_TOP_OFFSET_PX}px`;
}
