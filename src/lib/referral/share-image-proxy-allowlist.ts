const SHARE_IMAGE_PROXY_ALLOWED_HOSTS = new Set([
  "polymarket-upload.s3.us-east-2.amazonaws.com",
  "flagcdn.com",
]);

export function isShareImageProxyUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return false;
    }

    return SHARE_IMAGE_PROXY_ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
