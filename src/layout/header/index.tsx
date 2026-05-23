"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "../../lib/cn";
import { WalletMenuButton } from "../../components/trading/wallet-menu-button";
import { isNavActive, PRIMARY_NAV } from "./nav";

const NAV_PILL_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};

export function AppHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-between px-10 transition-[background-color,box-shadow,border-color] duration-200",
        isScrolled &&
          "border-b border-prophet-line/50 bg-white/75 shadow-prophet-wallet backdrop-blur-2xl backdrop-saturate-150"
      )}
    >
      <div className="flex items-center gap-7">
        <Link
          className="inline-flex items-center gap-0 text-prophet-navy"
          href="/"
          aria-label="Prophet home"
        >
          <img
            src="/logo.svg"
            alt=""
            width={29}
            height={27}
            className="block"
            aria-hidden
          />
          <span className="text-[13px] font-extrabold tracking-[0.08em]">
            PROPHET
          </span>
        </Link>
        <nav
          className="flex flex-1 items-center justify-end gap-[34px] text-[13px] text-prophet-nav"
          aria-label="Primary navigation"
        >
          {PRIMARY_NAV.map(({ href, label }) => {
            const active = isNavActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative inline-flex h-8 items-center rounded-[40px] px-4 transition-colors duration-200",
                  active
                    ? "text-white"
                    : "text-prophet-nav hover:text-[#14203a]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="header-nav-pill"
                    className="absolute inset-0 rounded-[40px] bg-black"
                    transition={NAV_PILL_TRANSITION}
                    aria-hidden
                  />
                ) : (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-[40px] bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.07]"
                    aria-hidden
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <WalletMenuButton />
    </header>
  );
}
