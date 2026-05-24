"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";

import { cn } from "@/lib/cn";

const HOME_SECTIONS = [
  { href: "/fifa", label: "Winner" },
  { href: "/fifa/matches", label: "Matches" }
] as const;

const SECTION_UNDERLINE_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};

function isSectionActive(pathname: string, href: string): boolean {
  if (href === "/fifa") {
    return pathname === "/fifa";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HomeSectionNav() {
  const pathname = usePathname();
  const underlineLayoutId = `${useId()}-home-section-underline`;

  return (
    <nav
      role="tablist"
      aria-label="World Cup market views"
      className="mb-6 flex h-9 items-start gap-6"
    >
      {HOME_SECTIONS.map((section) => {
        const isActive = isSectionActive(pathname, section.href);

        return (
          <Link
            key={section.href}
            href={section.href}
            prefetch
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className="flex min-w-0 flex-col items-center border-0 bg-transparent p-0 no-underline"
          >
            <span
              className={cn(
                "text-center text-[18px] leading-[21px] text-black transition-opacity duration-200",
                isActive ? "font-[556] opacity-100" : "font-[457] opacity-55"
              )}
            >
              {section.label}
            </span>
            {isActive ? (
              <motion.span
                layoutId={underlineLayoutId}
                aria-hidden="true"
                className="mt-auto block h-0 w-10 shrink-0 border-b-[3px] border-black"
                transition={SECTION_UNDERLINE_TRANSITION}
              />
            ) : (
              <span
                aria-hidden="true"
                className="mt-auto block h-0 w-10 shrink-0 border-b-[3px] border-transparent"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
