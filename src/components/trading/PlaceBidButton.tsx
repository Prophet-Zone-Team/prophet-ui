"use client";

import type { ReactNode } from "react";
import { useState } from "react";

interface PlaceBidButtonProps {
  children?: ReactNode;
  className?: string;
  teamName?: string;
}

export function PlaceBidButton({ children = "Quick Bid", className = "market-quick-bid", teamName }: PlaceBidButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </button>

      {isModalOpen ? (
        <div className="bid-tbd-backdrop" role="dialog" aria-modal="true" aria-labelledby="bid-tbd-title">
          <div className="bid-tbd-dialog">
            <p>Trading module</p>
            <h2 id="bid-tbd-title">Bid flow TBD</h2>
            <span>
              {teamName ? `${teamName} real order flow is not enabled here yet.` : "The embedded real order flow is not enabled yet."}
              {" "}Orders will require the user&apos;s own connected account, eligibility checks, balance checks, and explicit confirmation.
            </span>
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
