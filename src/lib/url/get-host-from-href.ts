export function getHostFromHref(href: string): string {
  try {
    return new URL(href).host;
  } catch {
    return href;
  }
}
