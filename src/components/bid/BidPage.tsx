"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { calculatePotentialPayout } from "../../lib/market/mockBid";
import { readStoredBids, writeStoredBids } from "../../lib/storage/local-terminal";
import type { MockBid, TeamMarketSnapshot } from "../../types/market";
import {
  formatChange,
  formatProbability,
  formatVolume,
  getChangeTone,
  getSentimentLabel,
} from "../home/market-formatters";

interface BidPageProps {
  snapshots: TeamMarketSnapshot[];
}

export function BidPage({ snapshots }: BidPageProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(snapshots[0]?.team.id ?? "");
  const [amount, setAmount] = useState("100");
  const [savedBids, setSavedBids] = useState<MockBid[]>([]);

  useEffect(() => {
    setSavedBids(readStoredBids());
  }, []);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.team.id === selectedTeamId) ?? snapshots[0],
    [selectedTeamId, snapshots],
  );
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;
  const potentialPayout = selectedSnapshot
    ? calculatePotentialPayout(safeAmount, selectedSnapshot.market.probability)
    : 0;

  function saveMockBid() {
    if (!selectedSnapshot || safeAmount <= 0) {
      return;
    }

    const nextBid: MockBid = {
      id: `mock-bid-${selectedSnapshot.team.id}-${Date.now()}`,
      teamId: selectedSnapshot.team.id,
      side: "yes",
      stake: safeAmount,
      probabilityAtBid: selectedSnapshot.market.probability,
      potentialReturn: potentialPayout,
      status: "simulated",
      createdAt: new Date().toISOString(),
    };
    const nextBids = [nextBid, ...readStoredBids()];

    writeStoredBids(nextBids);
    setSavedBids(nextBids);
  }

  return (
    <main className="terminal-grid min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:gap-10">
        <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal sm:p-8 lg:p-10">
          <TopLinks />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Simulation desk</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
                Mock Bid Page
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
                Select a team, enter a mock bid amount, and inspect a potential payout scenario using the current
                market probability.
              </p>
              <p className="mt-5 rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 p-4 text-sm leading-6 text-terminal-amber">
                Mock bid only. This is not financial advice and does not execute a real trade.
              </p>
            </div>
            {selectedSnapshot ? <SelectedTeamPanel snapshot={selectedSnapshot} /> : null}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
            <SectionHeader
              eyebrow="Create scenario"
              title="Mock Bid Controls"
              description="The scenario is stored locally in this browser only."
            />
            <div className="mt-8 grid gap-6">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Choose team</span>
                <select
                  value={selectedTeamId}
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                  className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 text-terminal-text outline-none focus:border-terminal-cyan"
                >
                  {snapshots.map((snapshot) => (
                    <option key={snapshot.team.id} value={snapshot.team.id}>
                      {snapshot.team.name} / {formatProbability(snapshot.market.probability)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Mock bid amount</span>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 text-terminal-text outline-none focus:border-terminal-cyan"
                />
              </label>

              <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <ScenarioMetric label="Current probability" value={selectedSnapshot ? formatProbability(selectedSnapshot.market.probability) : "0.0%"} />
                  <ScenarioMetric label="Potential payout" value={`$${potentialPayout.toFixed(2)}`} />
                </div>
                <button
                  type="button"
                  onClick={saveMockBid}
                  className="mt-6 w-full rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20"
                >
                  Save mock bid
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
            <SectionHeader eyebrow="Local book" title="Saved Mock Bids" />
            <div className="mt-8 grid gap-4">
              {savedBids.length > 0 ? (
                savedBids.slice(0, 8).map((bid) => {
                  const snapshot = snapshots.find((item) => item.team.id === bid.teamId);

                  return (
                    <article key={bid.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Mock bid</p>
                          <h3 className="mt-2 text-lg font-semibold text-terminal-text">
                            {snapshot?.team.name ?? bid.teamId}
                          </h3>
                        </div>
                        <p className="text-sm font-semibold text-terminal-green">${bid.potentialReturn.toFixed(2)}</p>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <ScenarioMetric label="Amount" value={`$${bid.stake.toFixed(2)}`} />
                        <ScenarioMetric label="Probability" value={formatProbability(bid.probabilityAtBid)} />
                        <ScenarioMetric label="Status" value={bid.status} />
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
                  <h3 className="text-lg font-semibold text-terminal-text">No saved mock bids yet</h3>
                  <p className="mt-2 text-sm leading-6 text-terminal-muted">
                    Create a local scenario on the left. Nothing is sent to a server or trade venue.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SelectedTeamPanel({ snapshot }: { snapshot: TeamMarketSnapshot }) {
  const { team, market } = snapshot;

  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Selected team</p>
          <h2 className="mt-3 text-3xl font-semibold text-terminal-text">{team.name}</h2>
          <p className="mt-1 text-xs text-terminal-muted">
            {team.code} / Group {team.group}
          </p>
        </div>
        <Link href={`/team/${team.id}`} className="rounded border border-terminal-cyan/50 px-3 py-2 text-xs text-terminal-cyan">
          Detail
        </Link>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <ScenarioMetric label="Probability" value={formatProbability(market.probability)} />
        <ScenarioMetric label="24h change" value={formatChange(market.change24h)} tone={getChangeTone(market.change24h)} />
        <ScenarioMetric label="Volume" value={formatVolume(market.volume)} />
        <ScenarioMetric label="Sentiment" value={getSentimentLabel(market.sentiment)} />
      </div>
    </div>
  );
}

function TopLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-terminal-muted">
      <Link href="/" className="hover:text-terminal-cyan">
        Market
      </Link>
      <Link href="/feed" className="hover:text-terminal-cyan">
        Feed
      </Link>
      <Link href="/watchlist" className="hover:text-terminal-cyan">
        Watchlist
      </Link>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl text-terminal-text sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-terminal-muted">{description}</p> : null}
    </div>
  );
}

function ScenarioMetric({
  label,
  value,
  tone = "text-terminal-text",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
