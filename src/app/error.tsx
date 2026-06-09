"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="panel error-panel" aria-labelledby="error-title">
      <span className="eyebrow">Market data error</span>
      <h1 id="error-title">Data feed interrupted</h1>
      <p>{error.message}</p>
      <div className="error-actions">
        <button type="button" className="bid-button" onClick={reset}>
          Retry
        </button>
        <Link className="hero-link" href="/fifa">
          Back to market
        </Link>
      </div>
    </section>
  );
}
