import { REFERRAL_SHARE_CARD_DOWNLOAD_FILENAME } from "@/lib/referral/config";
import { renderShareCardBlob } from "@/lib/referral/render-share-card";

export async function downloadShareCardPng(
  element: HTMLElement,
  filename = REFERRAL_SHARE_CARD_DOWNLOAD_FILENAME,
): Promise<boolean> {
  try {
    const blob = await renderShareCardBlob(element);
    if (!blob) {
      return false;
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = objectUrl;
    link.click();
    URL.revokeObjectURL(objectUrl);
    return true;
  } catch {
    return false;
  }
}
