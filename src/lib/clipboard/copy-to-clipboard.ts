export async function copyToClipboard(
  text: string | undefined
): Promise<boolean> {
  if (!text || typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
