import Link from "next/link";

import type { ReferralTab } from "@/types/landing";

interface ReferralTabsProps {
  tabs: ReferralTab[];
}

export function ReferralTabs({ tabs }: ReferralTabsProps) {
  return (
    <div className="referral-tabs" role="navigation" aria-label="Portfolio sections">
      {tabs.map((tab) => (
        <Link key={tab.label} href={tab.href} className={tab.active ? "active" : undefined}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
