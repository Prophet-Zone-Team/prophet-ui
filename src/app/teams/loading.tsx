export default function TeamsLoading() {
  return (
    <>
      <section className="teams-page-hero" aria-label="Loading team directory">
          <div>
            <span className="eyebrow">Team directory</span>
            <div className="loading-headline" />
            <div className="loading-copy" />
            <div className="loading-copy short" />
          </div>
          <div className="teams-summary" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="hero-stat loading-block" />
            ))}
          </div>
        </section>

        <section className="team-feature-grid" aria-label="Loading featured football data">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="team-feature-card loading-card" />
          ))}
        </section>

        <section className="panel teams-index-panel" aria-label="Loading team directory">
          <div className="panel-head">
            <h2 className="panel-title">Teams Directory</h2>
            <span className="live">Loading</span>
          </div>
          <div className="teams-index-list" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="team-directory-row loading-card" />
            ))}
          </div>
      </section>
    </>
  );
}
