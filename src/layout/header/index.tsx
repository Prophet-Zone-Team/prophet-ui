"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { WalletMenuButton } from "@/layout/header/wallet-menu-button";
import NavBar from "./navigation-bar";
import { shouldHideWalletFundingControls } from "./nav";
import { useTranslations } from "next-intl";
import { useDarkModeEnabled } from "@/store";

export function AppHeader() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const darkModeEnabled = useDarkModeEnabled();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const isPrivateMode = useMemo(() => {
    return [/^\/private/].some((reg) => reg.test(pathname));
  }, [pathname]);

  const hideWalletFundingControls = useMemo(
    () => shouldHideWalletFundingControls(pathname),
    [pathname]
  );

  const homeLink = useMemo(() => {
    let _homeLink = "/";
    if (isPrivateMode) {
      _homeLink = "/private";
    }
    return _homeLink;
  }, [isPrivateMode]);

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
        "fixed inset-x-0 z-50 flex h-[60px] items-center justify-center transition-[background-color,box-shadow,border-color] duration-150",
        isScrolled &&
          "bg-prophet-panel/75 shadow-prophet-wallet backdrop-blur-2xl backdrop-saturate-150",
        "pl-3 pr-3 md:pl-2 md:pr-0"
      )}
    >
      <div className="w-full md:w-[1412px] flex items-center justify-between">
        <div className="flex items-center gap-[50px]">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              className="inline-flex items-center gap-[6px]"
              href={homeLink}
              aria-label={t("prophetHome")}
            >
              <img
                src={darkModeEnabled ? "/logo-light.svg" : "/logo.svg"}
                alt=""
                width={29}
                height={27}
                className="block"
                aria-hidden
              />
              <span className="hidden md:block text-[20px] font-[500] text-prophet-foreground">
                PROPHET
              </span>
            </Link>
          </div>
          {!isPrivateMode && (
            <NavBar className="hidden md:flex flex-1 items-center justify-end gap-[20px]" />
          )}
        </div>

        <WalletMenuButton
          isPrivateMode={isPrivateMode}
          hideWalletFundingControls={hideWalletFundingControls}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onMobileDrawerClose={() => setIsMobileDrawerOpen(false)}
        />
      </div>
    </header>
  );
}
