export default function Loading() {
  return (
    <main className="prophet-html">
      <div className="page">
        <header className="topbar">
          <div className="brand" aria-label="Prophet loading">
            <span className="mark" aria-hidden="true" />
            Prophet
          </div>
          <nav aria-label="Loading navigation">
            <span>Markets</span>
            <span>Matches</span>
            <span>Teams</span>
            <span>Portfolio</span>
          </nav>
          <div className="wallet-connect-button">Connect</div>
        </header>

        <section className="hero loading-hero" aria-label="Loading market data">
          <div className="pixel-blast-container pixel-blast-fallback" aria-hidden="true" />
          <div className="hero-copy">
            <span className="eyebrow">Prediction market terminal</span>
            <div className="loading-headline" />
            <div className="loading-copy" />
            <div className="loading-copy short" />
            <div className="hero-actions">
              <div className="bid-button">Place a Bid</div>
              <div className="loading-link" />
            </div>
            <div className="hero-stats" aria-hidden="true">
              <div className="hero-stat loading-block" />
              <div className="hero-stat loading-block" />
              <div className="hero-stat loading-block" />
            </div>
          </div>

          <aside className="hero-terminal">
            <div className="terminal-inner">
              <div className="terminal-head">
                <div className="terminal-kicker">Live Signal Terminal</div>
                <span className="terminal-live">Loading</span>
              </div>
              <div className="signal-hero-card">
                <div className="loading-line wide" />
                <div className="loading-line" />
                <div className="loading-line narrow" />
              </div>
              <div className="terminal-list">
                <div className="terminal-row loading-row" />
                <div className="terminal-row loading-row" />
                <div className="terminal-row loading-row" />
              </div>
            </div>
          </aside>
        </section>

        <section className="dashboard" aria-label="Loading dashboard">
          <div className="panel probability">
            <div className="panel-head">
              <h2 className="panel-title">World Cup Winner Probability</h2>
              <span className="live">Loading</span>
            </div>
            <div className="teams-grid">
              {Array.from({ length: 16 }, (_, index) => (
                <div key={index} className="team-card loading-card" />
              ))}
            </div>
          </div>

          <aside className="panel movement">
            <div className="panel-head">
              <h2 className="panel-title">Highlighted Movement</h2>
            </div>
            <div className="movement-list">
              <div className="move-card loading-card" />
              <div className="move-card loading-card" />
              <div className="move-card loading-card" />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
