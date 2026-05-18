"use client";

import Link from "next/link";

import { WalletMenuButton } from "../components/trading/WalletMenuButton";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="prophet-html">
      <div className="page">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Prophet home">
            <span className="mark" aria-hidden="true" />
            Prophet
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/markets?source=polymarket">Markets</Link>
            <Link href="/matches?source=polymarket">Matches</Link>
            <Link href="/teams?source=polymarket">Teams</Link>
            <Link href="/bid?source=polymarket">Portfolio</Link>
          </nav>
          <WalletMenuButton source="polymarket" />
        </header>

        <section className="panel error-panel" aria-labelledby="error-title">
          <span className="eyebrow">Market data error</span>
          <h1 id="error-title">Data feed interrupted</h1>
          <p>{error.message}</p>
          <div className="error-actions">
            <button type="button" className="bid-button" onClick={reset}>
              Retry
            </button>
            <Link className="hero-link" href="/">
              Back to market
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
