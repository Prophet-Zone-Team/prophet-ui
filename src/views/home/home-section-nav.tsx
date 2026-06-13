"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { trackMarketTabChanged } from "@/lib/analytics/tracking";

const HOME_SECTIONS = [
  { href: "/fifa", labelKey: "matches" },
  { href: "/fifa/winner", labelKey: "worldCupWinner" },
  { href: "/fifa/groups", labelKey: "groups" }
] as const;

function isSectionActive(pathname: string, href: string): boolean {
  if (href === "/fifa") {
    return pathname === "/fifa";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HomeSectionNav() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const router = useRouter();

  const activeHref =
    HOME_SECTIONS.find((section) => isSectionActive(pathname, section.href))
      ?.href ?? HOME_SECTIONS[0].href;

  return (
    <TabSwitcher
      items={HOME_SECTIONS.map((section) => ({
        id: section.href,
        label: t(section.labelKey)
      }))}
      value={activeHref}
      onChange={(href) => {
        const section = HOME_SECTIONS.find((item) => item.href === href);
        trackMarketTabChanged({
          fromRange: activeHref,
          toRange: href,
          target: href,
          label: (() => {
            const section = HOME_SECTIONS.find((item) => item.href === href);
            return section ? t(section.labelKey) : undefined;
          })(),
          section: "home_market_tabs"
        });
        router.push(href);
      }}
      aria-label="World Cup market views"
      className="md:pl-[40px] mb-[-4px] justify-center md:justify-start"
    />
  );
}
