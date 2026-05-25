export const PRIMARY_NAV = [
  { href: "/fifa", label: "FIFA" },
  { href: "/analytics", label: "Analytics" },
  { href: "/tracks", label: "Tracks" },
  { href: "/portfolio", label: "Portfolio" }
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/fifa") {
    return pathname === "/fifa" || pathname.startsWith("/fifa/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
