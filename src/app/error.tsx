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
            <Link href="/markets">Markets</Link>
            <Link href="/matches">Matches</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/portfolio">Portfolio</Link>
          </nav>
          <WalletMenuButton />
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
