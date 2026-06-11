export const PRIMARY_NAV = [
  { href: "/fifa/matches", labelKey: "matches" as const },
  { href: "/analytics", labelKey: "analytics" as const },
  { href: "/strategy", labelKey: "strategies" as const },
  { href: "/tracks", labelKey: "tracks" as const },
  { href: "/portfolio", labelKey: "portfolio" as const }
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/fifa") {
    return pathname === "/fifa" || pathname.startsWith("/fifa/");
  }

  if (href === "/portfolio") {
    return (
      pathname === "/portfolio" ||
      pathname.startsWith("/portfolio/") ||
      pathname === "/referral"
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
