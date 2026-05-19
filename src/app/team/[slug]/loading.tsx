export default function TeamDetailLoading() {
  return (
    <main className="prophet-html">
      <div className="page team-detail-page">
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

        <section className="team-detail-hero" aria-label="Loading team detail">
          <div className="team-detail-breadcrumb">
            <span>Teams</span>
            <span>/</span>
            <span>Loading</span>
          </div>

          <div className="team-detail-hero-card">
            <div className="team-detail-identity">
              <div className="team-detail-flag loading-block" />
              <div>
                <div className="loading-line wide" />
                <div className="loading-line" />
                <div className="team-detail-tags" aria-hidden="true">
                  <span className="loading-block" />
                  <span className="loading-block" />
                  <span className="loading-block" />
                </div>
              </div>
            </div>

            <div className="team-detail-hero-metrics" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="team-hero-metric loading-block" />
              ))}
            </div>

            <div className="team-detail-hero-actions" aria-hidden="true">
              <div className="market-quick-bid loading-block" />
              <div className="team-detail-favorite loading-block" />
            </div>
          </div>
        </section>

        <div className="team-detail-grid" aria-label="Loading team analysis">
          <div className="team-detail-main">
            <section className="team-detail-two-up">
              <div className="panel team-detail-panel probability-panel">
                <div className="panel-head">
                  <h2 className="panel-title">Winner Probability Over Time</h2>
                  <div className="team-detail-tabs">
                    <span>24H</span>
                    <strong>7D</strong>
                    <span>30D</span>
                  </div>
                </div>
                <div className="team-probability-chart loading-card" />
                <div className="team-detail-mini-grid two">
                  <div className="detail-metric loading-block" />
                  <div className="detail-metric loading-block" />
                  <div className="detail-metric loading-block" />
                </div>
              </div>

              <div className="panel team-detail-panel strength-panel">
                <div className="panel-head">
                  <h2 className="panel-title">Team Strength</h2>
                  <span className="live">Loading</span>
                </div>
                <div className="team-strength-chart loading-card" />
                <div className="strength-score loading-block" />
              </div>
            </section>

            <div className="panel team-detail-panel lineup-panel">
              <div className="panel-head">
                <h2 className="panel-title">Expected Starting XI</h2>
                <span className="view-all">Loading</span>
              </div>
              <div className="lineup-layout">
                <div className="pitch loading-card" />
                <div className="bench-list loading-card" />
              </div>
            </div>

            <div className="panel team-detail-panel key-players-panel">
              <div className="panel-head">
                <h2 className="panel-title">Key Players</h2>
                <span className="view-all">Loading</span>
              </div>
              <div className="key-player-grid">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="key-player-card loading-card" />
                ))}
              </div>
            </div>

            <div className="panel team-detail-panel recent-matches-panel">
              <div className="panel-head">
                <h2 className="panel-title">Recent Matches</h2>
                <span className="view-all">Loading</span>
              </div>
              <div className="recent-match-table">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="recent-match-row loading-card" />
                ))}
              </div>
            </div>

            <div className="panel team-detail-panel news-signals-panel">
              <div className="panel-head">
                <h2 className="panel-title">News-to-Market Signals</h2>
                <span className="view-all">Loading</span>
              </div>
              <div className="news-signal-grid">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="news-signal-card loading-card" />
                ))}
              </div>
            </div>
          </div>

          <aside className="team-detail-sidebar">
            <div className="panel team-detail-panel trade-entry-panel loading-card" />
            <div className="panel team-detail-panel related-markets-panel loading-card" />
            <div className="panel team-detail-panel intelligence-panel loading-card" />
            <div className="panel team-detail-panel next-match-panel loading-card" />
          </aside>
        </div>
      </div>
    </main>
  );
}
