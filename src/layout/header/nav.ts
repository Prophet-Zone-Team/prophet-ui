export const PRIMARY_NAV = [
  { href: "/markets", label: "FIFA" },
  { href: "/news", label: "Analytics" },
  { href: "/tracks", label: "Tracks" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
