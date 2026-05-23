export const PRIMARY_NAV = [
  { href: "/", label: "FIFA" },
  { href: "/news", label: "Analytics" },
  { href: "/tracks", label: "Tracks" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
