"use client";

import { tradeMarketButtonClass } from "@/views/trade/trade-widget/trade-ui";

export function TradeMarketButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Market order (FAK)"
      className={tradeMarketButtonClass}
    >
      <span>Market</span>
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M1 1L4 4L7 1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
