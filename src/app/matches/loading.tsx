export default function MatchesLoading() {
  return (
    <>
      <section className="matches-page-hero" aria-label="Loading match markets">
          <div>
            <span className="eyebrow">Match market board</span>
            <div className="loading-headline" />
            <div className="loading-copy" />
            <div className="loading-copy short" />
          </div>
          <div className="matches-summary" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="hero-stat loading-block" />
            ))}
          </div>
        </section>

        <section className="matches-command-grid" aria-label="Loading match command center">
          <div className="panel match-feature-panel loading-card" />
          <div className="panel match-signal-panel loading-card" />
        </section>

        <section className="panel matches-board-panel" aria-label="Loading match board">
          <div className="panel-head">
            <h2 className="panel-title">Upcoming Match Markets</h2>
            <span className="live">Loading</span>
          </div>
          <div className="matches-board" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="match-market-card loading-card" />
            ))}
          </div>
      </section>
    </>
  );
}
