"use client";

import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import { portfolioTableScrollClass } from "@/views/portfolio/portfolio-ui";
import { PortfolioStrategyCard } from "./portfolio-strategy-card";
import { PortfolioStrategyRecord } from "./types";

export function PortfolioStrategyList() {
  const strategies: PortfolioStrategyRecord[] = [];

  if (strategies.length === 0) {
    return (
      <PortfolioEmptyState
        title="No strategies yet"
        body="Strategy positions will appear here after you place a strategy bid."
      />
    );
  }

  return (
    <div className={portfolioTableScrollClass} aria-label="Your strategies">
      <div className="flex flex-col">
        {strategies.map((strategy) => (
          <PortfolioStrategyCard key={strategy.id} strategy={strategy} />
        ))}
      </div>
    </div>
  );
}
