export default function MarketsLoading() {
  return (
    <>
      <section className="markets-hero" aria-label="Loading World Cup markets">
          <div>
            <span className="eyebrow">World Cup markets</span>
            <div className="loading-headline" />
            <div className="loading-copy" />
            <div className="loading-copy short" />
          </div>
          <div className="markets-summary" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="hero-stat loading-block" />
            ))}
          </div>
        </section>

        <section className="panel markets-list-panel" aria-label="Loading team market list">
          <div className="panel-head">
            <h2 className="panel-title">World Cup Winner Probability</h2>
            <span className="live">Loading</span>
          </div>

          <div className="markets-list" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="market-row loading-card" />
            ))}
          </div>

          <div className="footnote">
            <span>Loading market probabilities.</span>
            <span>Loading update time.</span>
          </div>
      </section>
    </>
  );
}
