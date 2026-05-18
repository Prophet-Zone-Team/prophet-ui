"use client";

import Link from "next/link";

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
            <Link href="/">Markets</Link>
            <Link href="/#matches-title">Matches</Link>
            <Link href="/#teams-title">Teams</Link>
            <Link href="/bid">Portfolio</Link>
          </nav>
          <Link className="bid-button" href="/bid">
            Place a Bid
          </Link>
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
