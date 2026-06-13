function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashIdentifier(value: string): Promise<string | undefined> {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (typeof crypto === "undefined" || !crypto.subtle?.digest) {
    return undefined;
  }

  try {
    const encoded = new TextEncoder().encode(normalized.toLowerCase());
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return toHex(digest);
  } catch {
    return undefined;
  }
}
