import Link from "next/link";

import { getNewsArticleSlug } from "../../lib/news/newsSlugs";
import type { NewsArticle, TeamMarketSnapshot } from "../../types/market";
import { WalletMenuButton } from "../trading/WalletMenuButton";

export function NewsPage({
  articles,
  snapshots,
}: {
  articles: NewsArticle[];
  snapshots: TeamMarketSnapshot[];
}) {
  return (
    <main className="prophet-html">
      <div className="page">
        <NewsTopbar current="news" />
        <section className="panel news-index-hero">
          <span className="eyebrow">World Cup news context</span>
          <h1>News signals for search and market context.</h1>
          <p>Stored GDELT coverage linked to World Cup teams. Articles are summarized as context and link back to the original source.</p>
        </section>
        <section className="news-index-list">
          {articles.length > 0 ? articles.map((article) => (
            <Link key={article.id} href={`/news/${getNewsArticleSlug(article)}`} className="news-index-card">
              <span>{article.source ?? "World Cup news"} / {formatDate(article.publishedAt)}</span>
              <h2>{article.title}</h2>
              <p>{article.snippet ?? "Related World Cup coverage stored from the news signal cache."}</p>
              <small>{getTeamNames(article, snapshots).join(", ") || "World Cup"}</small>
            </Link>
          )) : (
            <div className="news-index-card empty">
              <h2>No cached news yet</h2>
              <p>News appears here after the GDELT collector stores related World Cup articles.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function NewsDetailPage({
  article,
  snapshots,
}: {
  article: NewsArticle;
  snapshots: TeamMarketSnapshot[];
}) {
  const relatedTeams = getTeamNames(article, snapshots);

  return (
    <main className="prophet-html">
      <div className="page">
        <NewsTopbar current="news" />
        <article className="panel news-detail">
          <Link className="view-all" href="/news">Back to news</Link>
          <span className="eyebrow">{article.source ?? "World Cup news"} / {formatDate(article.publishedAt)}</span>
          <h1>{article.title}</h1>
          <p>{article.snippet ?? "This item is stored as market context. Read the original source for the full article."}</p>
          <div className="news-detail-meta">
            <span>Related teams: {relatedTeams.join(", ") || "World Cup"}</span>
            <span>Keywords: {article.matchedKeywords.slice(0, 6).join(", ") || "none stored"}</span>
          </div>
          <a className="bid-button" href={article.url} rel="noreferrer" target="_blank">Open original source</a>
        </article>
      </div>
    </main>
  );
}

function NewsTopbar({ current }: { current: "news" }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/markets">Markets</Link>
        <Link href="/matches">Matches</Link>
        <Link href="/teams">Teams</Link>
        <Link href="/search">Search</Link>
        <Link href="/feed">Feed</Link>
        <Link href="/news" aria-current={current === "news" ? "page" : undefined}>News</Link>
      </nav>
      <WalletMenuButton />
    </header>
  );
}

function getTeamNames(article: NewsArticle, snapshots: TeamMarketSnapshot[]): string[] {
  return article.matchedTeamIds
    .map((teamId) => snapshots.find((snapshot) => snapshot.team.id === teamId)?.team.name)
    .filter((name): name is string => Boolean(name));
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "Date pending";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
