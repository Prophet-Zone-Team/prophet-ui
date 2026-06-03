import { toPng } from "html-to-image";

import { REFERRAL_SHARE_CARD_DOWNLOAD_FILENAME } from "@/lib/referral/config";

export async function downloadShareCardPng(
  element: HTMLElement,
): Promise<boolean> {
  try {
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    if (width <= 0 || height <= 0) {
      return false;
    }

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      width,
      height,
      canvasWidth: width * 2,
      canvasHeight: height * 2,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        margin: "0",
        boxSizing: "border-box",
        overflow: "visible",
      },
    });

    const link = document.createElement("a");
    link.download = REFERRAL_SHARE_CARD_DOWNLOAD_FILENAME;
    link.href = dataUrl;
    link.click();
    return true;
  } catch {
    return false;
  }
}
