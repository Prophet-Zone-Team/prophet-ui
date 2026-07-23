export const PRIMARY_NAV = [
  { href: "/uefa/matches", labelKey: "matches" as const },
  { href: "/analytics", labelKey: "analytics" as const },
  { href: "/smart-money", labelKey: "smartMoney" as const },
  { href: "/portfolio", labelKey: "portfolio" as const }
] as const;

export const MOBILE_BOTTOM_NAV = [
  {
    href: "/uefa",
    labelKey: "worldCup" as const,
    icon: "worldCup" as const
  },
  {
    href: "/smart-money",
    labelKey: "smartMoney" as const,
    icon: "smartMoney" as const
  },
  {
    href: "/portfolio",
    labelKey: "portfolio" as const,
    icon: "portfolio" as const,
    showBalance: true
  }
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/uefa/matches") {
    return (
      pathname === "/uefa/matches" ||
      pathname === "/uefa" ||
      pathname.startsWith("/uefa/")
    );
  }

  if (href === "/uefa") {
    return pathname === "/uefa" || pathname.startsWith("/uefa/");
  }

  if (href === "/fifa/matches") {
    return pathname === "/fifa/matches";
  }

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

export function shouldHideMobileBottomNav(pathname: string) {
  return (
    /^\/private/.test(pathname) ||
    pathname === "/team" ||
    pathname === "/group" ||
    pathname.startsWith("/trade") ||
    pathname.startsWith("/download")
  );
}

export function shouldHideAppChrome(pathname: string) {
  return pathname.startsWith("/download");
}

export function shouldHideWalletFundingControls(pathname: string) {
  return pathname === "/smart-money" || pathname.startsWith("/smart-money/");
}
