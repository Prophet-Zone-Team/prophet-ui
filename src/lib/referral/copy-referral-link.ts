import { copyToClipboard } from "@/lib/clipboard/copy-to-clipboard";

export async function copyReferralLink(url: string): Promise<boolean> {
  return copyToClipboard(url);
}
