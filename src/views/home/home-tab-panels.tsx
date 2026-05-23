"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { TabSwitcher } from "../../components/ui/tab-switcher";

const HOME_TABS = [
  { id: "winner", label: "Winner" },
  { id: "matches", label: "Matches" }
] as const;

type HomeTabId = (typeof HOME_TABS)[number]["id"];

export interface HomeTabPanelsProps {
  winner: ReactNode;
  matches: ReactNode;
}

export function HomeTabPanels({ winner, matches }: HomeTabPanelsProps) {
  const [activeTab, setActiveTab] = useState<HomeTabId>("winner");

  return (
    <>
      <TabSwitcher
        items={[...HOME_TABS]}
        value={activeTab}
        onChange={(id) => setActiveTab(id as HomeTabId)}
        aria-label="World Cup market views"
        className="mb-6"
      />

      <div role="tabpanel">
        {activeTab === "winner" ? winner : matches}
      </div>
    </>
  );
}
