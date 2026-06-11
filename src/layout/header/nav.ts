export const PRIMARY_NAV = [
  { href: "/fifa", label: "Matches" },
  { href: "/analytics", label: "Analytics" },
  { href: "/strategy", label: "Strategies" },
  { href: "/tracks", label: "Tracks" },
  { href: "/portfolio", label: "Portfolio" }
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/fifa") {
    return pathname === "/fifa" || pathname === "/fifa/matches";
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
