"use client";

import { usePathname, useRouter } from "next/navigation";

import { TabSwitcher } from "@/components/ui/tab-switcher";

const HOME_SECTIONS = [
  { href: "/fifa", label: "Matches" },
  { href: "/fifa/winner", label: "World Cup Winner" }
] as const;

function isSectionActive(pathname: string, href: string): boolean {
  if (href === "/fifa") {
    return pathname === "/fifa";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HomeSectionNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeHref =
    HOME_SECTIONS.find((section) => isSectionActive(pathname, section.href))
      ?.href ?? HOME_SECTIONS[0].href;

  return (
    <TabSwitcher
      items={HOME_SECTIONS.map((section) => ({
        id: section.href,
        label: section.label
      }))}
      value={activeHref}
      onChange={(href) => router.push(href)}
      aria-label="World Cup market views"
      className="md:pl-[40px] mb-[-4px] justify-center md:justify-start"
    />
  );
}
