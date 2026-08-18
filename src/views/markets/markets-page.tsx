"use client";

import { useEffect, useState } from "react";

import { MarketWsProvider } from "@/context/market-ws";
import { MarketsContent } from "@/views/markets/content";
import {
  MarketsTradeDesktop,
  MarketsTradeMobile
} from "@/views/markets/markets-trade-section";
import {
  marketsLayoutClass,
  marketsListMainClass,
  marketsNavAsideClass,
  marketsPageClass,
  marketsTradeAsideClass
} from "@/views/markets/markets-ui";
import { DEFAULT_MARKETS_NAV_ITEM_ID } from "@/views/markets/nav/config";
import { MarketsNav } from "@/views/markets/nav";
import type { MarketsNavItemId } from "@/views/markets/nav/config";
import { useMarketsTradeSelection } from "@/views/markets/use-markets-trade-selection";
import type { WorldCupMatch } from "@/types/market";

function MarketsPageContent() {
  const [selectedNavId, setSelectedNavId] = useState<MarketsNavItemId>(
    DEFAULT_MARKETS_NAV_ITEM_ID
  );
  const [activeMatch, setActiveMatch] = useState<WorldCupMatch | null>(null);

  const {
    selectedMatchId,
    selectedOddsId,
    selectMatchOdds,
    syncVisibleMatches,
    clearSelection
  } = useMarketsTradeSelection();

  const handleNavChange = (nextNavId: MarketsNavItemId) => {
    setSelectedNavId(nextNavId);
    clearSelection();
    setActiveMatch(null);
  };

  useEffect(() => {
    if (!selectedMatchId) {
      setActiveMatch(null);
    }
  }, [selectedMatchId]);

  return (
    <div className={marketsPageClass}>
      <div className={marketsLayoutClass}>
        <aside className={marketsNavAsideClass}>
          <MarketsNav value={selectedNavId} onChange={handleNavChange} />
        </aside>

        <main className={marketsListMainClass}>
          <MarketsContent
            categoryId={selectedNavId}
            selectedMatchId={selectedMatchId}
            selectedOddsId={selectedOddsId}
            onSelectMatchOdds={selectMatchOdds}
            onVisibleMatchesChange={syncVisibleMatches}
            onActiveMatchChange={setActiveMatch}
          />
        </main>

        {activeMatch ? (
          <aside className={marketsTradeAsideClass}>
            <div className="hidden md:block">
              <MarketsTradeDesktop match={activeMatch} />
            </div>
          </aside>
        ) : null}
      </div>

      {activeMatch ? <MarketsTradeMobile match={activeMatch} /> : null}
    </div>
  );
}

export function MarketsPage() {
  return (
    <MarketWsProvider enabled>
      <MarketsPageContent />
    </MarketWsProvider>
  );
}
