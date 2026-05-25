function hashAddress(address: string): number {
  const normalized = address.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function hslColor(seed: number, offset: number): string {
  const hue = (seed + offset * 67) % 360;
  const saturation = 62 + ((seed >> offset) % 18);
  const lightness = 52 + ((seed >> (offset + 3)) % 14);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function getWalletAvatarGradient(address: string): string {
  const seed = hashAddress(address);
  const colorA = hslColor(seed, 0);
  const colorB = hslColor(seed, 1);
  const colorC = hslColor(seed, 2);

  return `radial-gradient(100% 100% at 50% 0%, ${colorA} 0%, ${colorB} 65.38%, ${colorC} 100%)`;
}
