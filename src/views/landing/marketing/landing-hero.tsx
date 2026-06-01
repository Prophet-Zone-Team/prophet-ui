import Link from "next/link";

import type { LandingMarketingContent } from "@/types/landing";
import { ArrowIcon, LightningIcon } from "@/views/landing/landing-icons";
import { LandingFlag } from "@/views/landing/primitives/landing-flag";

interface LandingHeroProps {
  hero: LandingMarketingContent["hero"];
}

export function LandingHero({ hero }: LandingHeroProps) {
  const { featured, rows, metrics } = hero.terminal;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div
        className="pixel-blast-container pixel-blast-fallback"
        aria-hidden="true"
      />
      <div className="hero-copy">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h1 id="hero-title">
          {hero.titleLine1}
          <br />
          it <span>{hero.titleHighlight}</span>
        </h1>
        <p className="hero-subcopy">{hero.subcopy}</p>
        <div className="hero-actions">
          <Link className="bid-button" href="/fifa">
            Place a Bid
            <ArrowIcon />
          </Link>
          <div className="hero-secondary-actions">
            <a className="hero-link" href="#matches-title">
              View matches
              <ArrowIcon />
            </a>
            <div className="ticker-stack" aria-hidden="true">
              <div className="ticker-track">
                <div className="coin-row">
                  <span className="coin usd">$</span>
                </div>
                <div className="coin-row">
                  <span className="coin tether">T</span>
                </div>
                <div className="coin-row">%</div>
                <div className="coin-row">
                  <span className="coin usd">$</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-stats" aria-label="Prophet market summary">
          {hero.stats.map((stat) => (
            <div key={stat.label} className="hero-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <aside className="hero-terminal" aria-label="Live market signal terminal">
        <div className="terminal-inner">
          <div className="terminal-head">
            <div className="terminal-kicker">
              <LightningIcon />
              Live Signal Terminal
            </div>
            <span className="terminal-live">Live</span>
          </div>

          <div className="signal-hero-card">
            <div className="signal-hero-top">
              <div className="signal-team">
                <LandingFlag flag={featured.flag} flagKind={featured.flagKind} />
                {featured.title}
              </div>
              <div className="signal-score">
                <strong>{featured.value}</strong>
                <span className={featured.deltaDown ? "delta down" : "delta"}>
                  {featured.delta}
                </span>
              </div>
            </div>
            <div className="signal-bar">
              <span />
            </div>
            <div className="signal-copy">
              <span>
                {featured.copy} <strong>$24.6M</strong>
              </span>
              <span>High confidence</span>
            </div>
          </div>

          <div className="terminal-list">
            {rows.map((row) => (
              <article key={row.title} className="terminal-row">
                <LandingFlag flag={row.flag} flagKind={row.flagKind} />
                <div>
                  <h3>{row.title}</h3>
                  <p>{row.copy}</p>
                </div>
                <div>
                  <strong>{row.value}</strong>
                  <span className={row.deltaDown ? "delta down" : "delta"}>{row.delta}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="terminal-footer">
            {metrics.map((metric) => (
              <div key={metric.label} className="terminal-metric">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
