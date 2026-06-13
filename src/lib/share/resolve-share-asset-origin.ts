export function resolveShareAssetOrigin(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return undefined;
}
