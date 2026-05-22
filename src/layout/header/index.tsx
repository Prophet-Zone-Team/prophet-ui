"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { WalletMenuButton } from "../../components/trading/WalletMenuButton";
import { isNavActive, PRIMARY_NAV } from "./nav";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        {PRIMARY_NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={isNavActive(pathname, href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <WalletMenuButton />
    </header>
  );
}
