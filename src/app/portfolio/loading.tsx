export default function PortfolioLoading() {
  return (
    <div className="portfolio-page">
      <section className="portfolio-hero" aria-label="Loading portfolio">
          <div>
            <span className="eyebrow">Portfolio</span>
            <div className="loading-headline" />
            <div className="loading-copy" />
            <div className="loading-copy short" />
            <div className="portfolio-actions" aria-hidden="true">
              <div className="bid-button loading-block" />
              <div className="market-detail-button loading-block" />
            </div>
          </div>
          <div className="portfolio-account-panel loading-card" />
        </section>

        <section className="portfolio-summary-grid" aria-label="Loading portfolio summary">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="portfolio-summary-card loading-card" />
          ))}
        </section>

        <div className="portfolio-grid" aria-label="Loading portfolio detail">
          <div className="portfolio-main">
            <div className="panel portfolio-panel portfolio-performance-panel">
              <div className="panel-head">
                <h2 className="panel-title">Portfolio Performance</h2>
                <div className="team-detail-tabs">
                  <span>1D</span>
                  <strong>7D</strong>
                  <span>30D</span>
                  <span>All</span>
                </div>
              </div>
              <div className="portfolio-performance-chart loading-card" />
            </div>

            <div className="panel portfolio-panel open-positions-panel">
              <div className="panel-head">
                <h2 className="panel-title">Open Positions</h2>
                <span className="view-all">Loading</span>
              </div>
              <div className="portfolio-position-table">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="portfolio-position-row loading-card" />
                ))}
              </div>
            </div>

            <div className="panel portfolio-panel exposure-breakdown-panel">
              <div className="panel-head">
                <h2 className="panel-title">Exposure Breakdown</h2>
              </div>
              <div className="exposure-breakdown-grid">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="donut-breakdown loading-card" />
                ))}
              </div>
            </div>

            <div className="panel portfolio-panel risk-watch-panel">
              <div className="panel-head">
                <h2 className="panel-title">Risk Watch</h2>
                <span className="view-all">Loading</span>
              </div>
              <div className="risk-watch-grid">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="risk-watch-card loading-card" />
                ))}
              </div>
            </div>
          </div>

          <aside className="portfolio-sidebar">
            <div className="panel portfolio-panel portfolio-signals-panel loading-card" />
            <div className="panel portfolio-panel adjust-position-panel loading-card" />
            <div className="panel portfolio-panel recent-activity-panel loading-card" />
          </aside>
      </div>
    </div>
  );
}
