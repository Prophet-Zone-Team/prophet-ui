"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SearchResult } from "../../types/market";
import { WalletMenuButton } from "../trading/WalletMenuButton";

export function SearchPage({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    setStatus("loading");

    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => {
        const typedPayload = payload as { results?: SearchResult[] };
        setResults(typedPayload.results ?? []);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, [query]);

  return (
    <main className="prophet-html">
      <div className="page">
        <SearchTopbar />
        <section className="panel search-page-panel">
          <span className="eyebrow">Global search</span>
          <h1>Find teams, matches, markets, news, and paths.</h1>
          <label className="global-search-input">
            <span>Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Argentina, Group C, Messi, Road to Final..." />
          </label>
        </section>
        <section className="search-results-list">
          {status === "loading" ? <p className="search-empty">Searching...</p> : null}
          {status === "error" ? <p className="search-empty">Search is unavailable right now.</p> : null}
          {status === "ready" && results.length === 0 ? <p className="search-empty">No results found.</p> : null}
          {results.map((result) => (
            <Link key={result.id} href={result.href} className="search-result-card">
              <span>{result.type}</span>
              <strong>{result.title}</strong>
              {result.subtitle ? <small>{result.subtitle}</small> : null}
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function SearchTopbar() {
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
        <Link href="/news">News</Link>
        <Link href="/search" aria-current="page">Search</Link>
      </nav>
      <WalletMenuButton />
    </header>
  );
}
