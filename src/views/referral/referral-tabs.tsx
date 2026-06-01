"use client";

import { useRouter } from "next/navigation";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import type { ReferralTab } from "@/types/referral";

interface ReferralTabsProps {
  tabs: ReferralTab[];
}

export function ReferralTabs({ tabs }: ReferralTabsProps) {
  const router = useRouter();
  const activeTab = tabs.find((tab) => tab.active) ?? tabs[0];

  return (
    <div className="mb-3.5 shrink-0 overflow-x-auto border-b border-prophet-line px-0.5 pt-0.5">
      <TabSwitcher
        items={tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
        value={activeTab.id}
        onChange={(tabId) => {
          const tab = tabs.find((item) => item.id === tabId);
          if (tab) {
            router.push(tab.href);
          }
        }}
        aria-label="Portfolio sections"
        size="compact"
        className="min-w-max gap-4 md:gap-6"
      />
    </div>
  );
}
