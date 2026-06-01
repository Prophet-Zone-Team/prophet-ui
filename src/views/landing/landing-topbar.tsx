import Link from "next/link";

import type { LandingNavItem } from "@/types/landing";
import { ArrowIcon } from "@/views/landing/landing-icons";

interface LandingTopbarProps {
  nav: LandingNavItem[];
}

export function LandingTopbar({ nav }: LandingTopbarProps) {
  return (
    <header className="topbar">
      <Link className="brand" href="/landing" aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        {nav.map((item) => (
          <Link key={item.label} href={item.href} className={item.active ? "active" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className="bid-button" href="/fifa">
        Place a Bid
        <ArrowIcon />
      </Link>
    </header>
  );
}
