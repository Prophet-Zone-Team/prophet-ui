"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import {
  calculateOutcomeReferencePrice,
  calculateReferencePrice,
  formatPriceCents,
  formatShareSize,
  normalizeLimitPrice,
} from "../../lib/market/mockBid";
import { buildBidOrderPreview, type BidOrderPreview } from "../../lib/market/polymarketOrder";
import { readStoredBids, writeStoredBids } from "../../lib/storage/local-terminal";
import type {
  BidExecutionMode,
  BidTradeSide,
  MockBid,
  MockBidOrderType,
  MockBidSide,
  TeamMarketSnapshot,
} from "../../types/market";
import { DataStatusBanner } from "../data/DataStatusBanner";
import {
  formatChange,
  formatProbability,
  formatVolume,
  getChangeTone,
  getSentimentLabel,
} from "../home/market-formatters";

interface BidPageProps {
  snapshots: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}

interface TradingConfigStatus {
  ready: boolean;
  missing: string[];
  funderAddress?: string;
  signatureType: number;
}

const ORDER_TYPES: MockBidOrderType[] = ["GTC", "FOK", "FAK"];
const REAL_ORDER_CONFIRMATION = "PLACE REAL ORDER";

export function BidPage({ snapshots, dataStatus }: BidPageProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(snapshots[0]?.team.id ?? "");
  const [amount, setAmount] = useState("100");
  const [outcomeSide, setOutcomeSide] = useState<MockBidSide>("yes");
  const [tradeSide, setTradeSide] = useState<BidTradeSide>("buy");
  const [executionMode, setExecutionMode] = useState<BidExecutionMode>("mock");
  const [orderType, setOrderType] = useState<MockBidOrderType>("GTC");
  const [limitPriceCents, setLimitPriceCents] = useState("0");
  const [displayAddress, setDisplayAddress] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [savedBids, setSavedBids] = useState<MockBid[]>([]);
  const [tradingConfig, setTradingConfig] = useState<TradingConfigStatus | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | undefined>();

  useEffect(() => {
    setSavedBids(readStoredBids());
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch("/api/bid/orders")
      .then((response) => response.json() as Promise<TradingConfigStatus>)
      .then((status) => {
        if (!ignore) {
          setTradingConfig(status);
        }
      })
      .catch(() => {
        if (!ignore) {
          setTradingConfig({
            ready: false,
            missing: ["POLYMARKET_API_STATUS"],
            signatureType: 0,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.team.id === selectedTeamId) ?? snapshots[0],
    [selectedTeamId, snapshots],
  );

  const referencePrice = selectedSnapshot
    ? calculateOutcomeReferencePrice(selectedSnapshot.market.probability, outcomeSide)
    : 0;

  useEffect(() => {
    if (!selectedSnapshot) {
      return;
    }

    setLimitPriceCents((referencePrice * 100).toFixed(1));
  }, [referencePrice, selectedSnapshot]);

  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;
  const numericLimitPriceCents = Number(limitPriceCents);
  const limitPrice = normalizeLimitPrice(
    Number.isFinite(numericLimitPriceCents) ? numericLimitPriceCents / 100 : referencePrice,
  );
  const preview = selectedSnapshot
    ? buildBidOrderPreview({
        snapshot: selectedSnapshot,
        outcomeSide,
        tradeSide,
        amount: safeAmount,
        limitPrice,
        orderType,
      })
    : null;
  const realOrderDisabledReason = getRealOrderDisabledReason(preview, tradingConfig, confirmationText);
  const canSubmitRealOrder = executionMode === "real" && !realOrderDisabledReason && preview;

  function saveMockBid() {
    if (!selectedSnapshot || !preview || safeAmount <= 0) {
      return;
    }

    const createdAt = new Date().toISOString();
    const nextPreview = buildBidOrderPreview({
      snapshot: selectedSnapshot,
      outcomeSide,
      tradeSide,
      amount: safeAmount,
      limitPrice,
      orderType,
      createdAt,
      includeOrderId: true,
    });
    const nextBid: MockBid = {
      id: `mock-bid-${selectedSnapshot.team.id}-${Date.now()}`,
      teamId: selectedSnapshot.team.id,
      side: outcomeSide,
      tradeSide,
      executionMode: "mock",
      stake: safeAmount,
      probabilityAtBid: selectedSnapshot.market.probability,
      potentialReturn: nextPreview.potentialPayout,
      status: "simulated",
      createdAt,
      limitPrice: nextPreview.sidePrice,
      shareSize: nextPreview.shareSize,
      orderType,
      simulatedOrderId: nextPreview.simulatedOrderId,
      simulatedTokenId: nextPreview.simulatedTokenId,
      estimatedCost: nextPreview.estimatedCost,
      potentialOutcome: nextPreview.potentialOutcome,
      expiresAt: nextPreview.expiresAt,
      displayAddress: displayAddress.trim() || undefined,
    };
    const nextBids = [nextBid, ...readStoredBids()];

    writeStoredBids(nextBids);
    setSavedBids(nextBids);
    setSubmitState("submitted");
    setSubmitMessage("Saved local simulated order.");
  }

  async function submitRealOrder() {
    if (!selectedSnapshot || !preview || !canSubmitRealOrder) {
      setSubmitState("error");
      setSubmitMessage(realOrderDisabledReason ?? "Order is not ready.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage(undefined);

    try {
      const response = await fetch("/api/bid/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "submit",
          tokenId: preview.tokenId,
          price: preview.sidePrice,
          size: preview.shareSize,
          tradeSide,
          orderType,
          tickSize: preview.tickSize,
          negRisk: preview.negRisk,
          confirmationText,
        }),
      });
      const payload = (await response.json()) as { error?: string; response?: unknown; submittedAt?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Polymarket CLOB order failed.");
      }

      setSubmitState("submitted");
      setSubmitMessage(`Real order submitted at ${payload.submittedAt ?? new Date().toISOString()}.`);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <main className="terminal-grid min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:gap-10">
        <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal sm:p-8 lg:p-10">
          <TopLinks source={dataStatus.source} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Trading desk</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
                Bid Console
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
                Build a Polymarket CLOB ticket for a World Cup market. Mock mode stays local; real mode submits through
                the server using configured Polymarket credentials after explicit confirmation.
              </p>
              <p className="mt-5 rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 p-4 text-sm leading-6 text-terminal-amber">
                Real orders can move funds or positions on Polymarket. This interface is execution tooling, not
                financial, betting, or investment advice.
              </p>
            </div>
            {selectedSnapshot ? (
              <SelectedTeamPanel snapshot={selectedSnapshot} side={outcomeSide} source={dataStatus.source} />
            ) : null}
          </div>
        </section>
        <DataStatusBanner meta={dataStatus} />

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
            <SectionHeader
              eyebrow="Create order"
              title="Order Parameters"
              description="Choose mock mode for a local scenario, or real mode for CLOB submission."
            />
            <div className="mt-8 grid gap-6">
              <label className="block" htmlFor="bid-team">
                <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Market</span>
                <select
                  id="bid-team"
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

              <SegmentedControl
                label="Mode"
                options={[
                  { value: "mock", label: "Mock" },
                  { value: "real", label: "Real" },
                ]}
                value={executionMode}
                onChange={(value) => setExecutionMode(value as BidExecutionMode)}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <SegmentedControl
                  label="Outcome"
                  options={[
                    { value: "yes", label: "YES" },
                    { value: "no", label: "NO" },
                  ]}
                  value={outcomeSide}
                  onChange={(value) => setOutcomeSide(value as MockBidSide)}
                />
                <SegmentedControl
                  label="Action"
                  options={[
                    { value: "buy", label: "Buy" },
                    { value: "sell", label: "Sell" },
                  ]}
                  value={tradeSide}
                  onChange={(value) => setTradeSide(value as BidTradeSide)}
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Order type</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {ORDER_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={
                        orderType === type
                          ? "rounded border border-terminal-cyan/60 bg-terminal-cyan/12 px-3 py-3 text-xs font-semibold text-terminal-cyan"
                          : "rounded border border-terminal-line bg-terminal-black px-3 py-3 text-xs font-semibold text-terminal-muted transition hover:border-terminal-cyan/50 hover:text-terminal-cyan"
                      }
                      aria-pressed={orderType === type}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block" htmlFor="bid-amount">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
                    {tradeSide === "buy" ? "Amount USDC" : "Shares to sell"}
                  </span>
                  <input
                    id="bid-amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 text-terminal-text outline-none focus:border-terminal-cyan"
                  />
                </label>

                <label className="block" htmlFor="bid-limit-price">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Limit price</span>
                  <div className="mt-3 flex rounded border border-terminal-line bg-terminal-black focus-within:border-terminal-cyan">
                    <input
                      id="bid-limit-price"
                      type="number"
                      min="1"
                      max="99"
                      step="0.1"
                      value={limitPriceCents}
                      onChange={(event) => setLimitPriceCents(event.target.value)}
                      className="w-full bg-transparent px-4 py-3 text-terminal-text outline-none"
                    />
                    <span className="border-l border-terminal-line px-4 py-3 text-sm text-terminal-muted">cents</span>
                  </div>
                </label>
              </div>

              {executionMode === "mock" ? (
                <label className="block" htmlFor="bid-address">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
                    Display-only address
                  </span>
                  <input
                    id="bid-address"
                    value={displayAddress}
                    onChange={(event) => setDisplayAddress(event.target.value)}
                    placeholder="Optional 0x display address"
                    className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 font-mono text-xs text-terminal-text outline-none focus:border-terminal-cyan"
                  />
                </label>
              ) : (
                <RealOrderConfirmation
                  confirmationText={confirmationText}
                  onConfirmationTextChange={setConfirmationText}
                  tradingConfig={tradingConfig}
                  disabledReason={realOrderDisabledReason}
                />
              )}

              <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <ScenarioMetric
                    label="Reference"
                    value={selectedSnapshot ? formatPriceCents(referencePrice) : "0.0c"}
                  />
                  <ScenarioMetric label="Limit" value={formatPriceCents(limitPrice)} />
                  <ScenarioMetric label="Size" value={preview ? formatShareSize(preview.shareSize) : "0"} />
                  <ScenarioMetric
                    label={tradeSide === "buy" ? "Potential outcome" : "Estimated proceeds"}
                    value={preview ? `$${preview.potentialOutcome.toFixed(2)}` : "$0.00"}
                    tone={preview && preview.potentialOutcome >= 0 ? "text-terminal-green" : "text-terminal-red"}
                  />
                </div>
                {executionMode === "mock" ? (
                  <button
                    type="button"
                    onClick={saveMockBid}
                    disabled={!selectedSnapshot || safeAmount <= 0}
                    className="mt-6 w-full rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
                  >
                    Save simulated order
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitRealOrder}
                    disabled={!canSubmitRealOrder || submitState === "submitting"}
                    className="mt-6 w-full rounded border border-terminal-red/60 bg-terminal-red/12 px-4 py-3 text-sm font-semibold text-terminal-red transition hover:bg-terminal-red/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
                  >
                    {submitState === "submitting" ? "Submitting real order..." : "Submit real CLOB order"}
                  </button>
                )}
                {submitMessage ? (
                  <p className={submitState === "error" ? "mt-4 text-xs leading-5 text-terminal-red" : "mt-4 text-xs leading-5 text-terminal-green"}>
                    {submitMessage}
                  </p>
                ) : (
                  <p className="mt-4 text-xs leading-5 text-terminal-muted">
                    Mock orders are local. Real orders are sent to Polymarket only after the confirmation text matches.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-8">
            <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
              <SectionHeader eyebrow="Ticket preview" title="CLOB Order Ticket" />
              {selectedSnapshot && preview ? (
                <OrderPreview
                  snapshot={selectedSnapshot}
                  preview={preview}
                  orderType={orderType}
                  executionMode={executionMode}
                  address={displayAddress}
                />
              ) : (
                <EmptyState title="No market selected" detail="Choose a team to preview an order ticket." />
              )}
            </section>

            <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
              <SectionHeader eyebrow="Local book" title="Saved Simulated Orders" />
              <div className="mt-8 grid gap-4">
                {savedBids.length > 0 ? (
                  savedBids.slice(0, 8).map((bid) => {
                    const snapshot = snapshots.find((item) => item.team.id === bid.teamId);

                    return <SavedBidCard key={bid.id} bid={bid} snapshot={snapshot} />;
                  })
                ) : (
                  <EmptyState
                    title="No saved simulated orders"
                    detail="Create a mock scenario from the ticket controls. Real orders are not stored in browser local storage."
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function SelectedTeamPanel({
  snapshot,
  side,
  source,
}: {
  snapshot: TeamMarketSnapshot;
  side: MockBidSide;
  source: MarketDataMeta["source"];
}) {
  const { team, market } = snapshot;
  const sidePrice = calculateReferencePrice(market.probability, side);
  const token = market.polymarket?.tokens[side];

  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Selected market</p>
          <h2 className="mt-3 text-3xl font-semibold text-terminal-text">{team.name}</h2>
          <p className="mt-1 text-xs text-terminal-muted">
            {team.code} / Group {team.group}
          </p>
        </div>
        <Link href={`/team/${team.id}?source=${source}`} className="rounded border border-terminal-cyan/50 px-3 py-2 text-xs text-terminal-cyan">
          Detail
        </Link>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <ScenarioMetric label="YES probability" value={formatProbability(market.probability)} />
        <ScenarioMetric label={`${side.toUpperCase()} reference`} value={formatPriceCents(sidePrice)} />
        <ScenarioMetric label="24h change" value={formatChange(market.change24h)} tone={getChangeTone(market.change24h)} />
        <ScenarioMetric label="Volume" value={formatVolume(market.volume)} />
        <ScenarioMetric label="Sentiment" value={getSentimentLabel(market.sentiment)} />
        <ScenarioMetric label="CLOB token" value={token?.tokenId ? "Available" : "Missing"} />
      </div>
    </div>
  );
}

function OrderPreview({
  snapshot,
  preview,
  orderType,
  executionMode,
  address,
}: {
  snapshot: TeamMarketSnapshot;
  preview: BidOrderPreview;
  orderType: MockBidOrderType;
  executionMode: BidExecutionMode;
  address: string;
}) {
  const addressValue = executionMode === "real" ? "Server credentials" : address.trim() || "Not set";

  return (
    <div className="mt-8">
      <div
        className={
          executionMode === "real"
            ? "rounded-lg border border-terminal-red/45 bg-terminal-red/10 p-4 text-sm leading-6 text-terminal-red"
            : "rounded-lg border border-terminal-cyan/35 bg-terminal-cyan/8 p-4 text-sm leading-6 text-terminal-cyan"
        }
      >
        {executionMode === "real"
          ? "Real mode: a confirmed submit will send a signed order to Polymarket CLOB."
          : "Mock mode: this preview creates no signature, no CLOB API request, and no real bid."}
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-terminal-line bg-terminal-panel2/75">
        <div className="border-b border-terminal-line bg-black/25 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Market</p>
          <h3 className="mt-2 text-xl font-semibold text-terminal-text">
            {snapshot.team.name} {preview.outcomeSide.toUpperCase()} / {preview.tradeSide.toUpperCase()}
          </h3>
        </div>
        <div className="grid gap-px bg-terminal-line sm:grid-cols-2">
          <TicketRow label="Mode" value={executionMode.toUpperCase()} />
          <TicketRow label="Order type" value={orderType} />
          <TicketRow label="Limit price" value={formatPriceCents(preview.sidePrice)} />
          <TicketRow label="Estimated cost" value={`$${preview.estimatedCost.toFixed(2)}`} />
          <TicketRow label="Size" value={formatShareSize(preview.shareSize)} />
          <TicketRow label="Potential payout" value={`$${preview.potentialPayout.toFixed(2)}`} />
          <TicketRow label="Potential outcome" value={`$${preview.potentialOutcome.toFixed(2)}`} />
          <TicketRow label="Accepting orders" value={preview.acceptingOrders ? "Yes" : "No"} />
        </div>
        <div className="grid gap-4 p-5">
          <CodeMetric label={executionMode === "real" ? "Credential scope" : "Display address"} value={addressValue} />
          <CodeMetric label="Token id" value={preview.tokenId ?? preview.simulatedTokenId} />
          <CodeMetric label="Tick / neg risk" value={`${preview.tickSize ?? "n/a"} / ${preview.negRisk ? "yes" : "no"}`} />
          <CodeMetric label="Order id" value={preview.simulatedOrderId ?? "Created after submit/save"} />
        </div>
      </div>
    </div>
  );
}

function RealOrderConfirmation({
  confirmationText,
  onConfirmationTextChange,
  tradingConfig,
  disabledReason,
}: {
  confirmationText: string;
  onConfirmationTextChange: (value: string) => void;
  tradingConfig: TradingConfigStatus | null;
  disabledReason?: string;
}) {
  const configText =
    tradingConfig === null
      ? "Checking server trading configuration..."
      : tradingConfig.ready
        ? `Ready / signature type ${tradingConfig.signatureType}`
        : `Missing ${tradingConfig.missing.join(", ")}`;

  return (
    <div className="rounded-lg border border-terminal-red/45 bg-terminal-red/10 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-red">Real order confirmation</p>
      <p className="mt-3 text-sm leading-6 text-terminal-muted">{configText}</p>
      {disabledReason ? <p className="mt-3 text-sm leading-6 text-terminal-red">{disabledReason}</p> : null}
      <label className="mt-5 block" htmlFor="real-order-confirmation">
        <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
          Type {REAL_ORDER_CONFIRMATION}
        </span>
        <input
          id="real-order-confirmation"
          value={confirmationText}
          onChange={(event) => onConfirmationTextChange(event.target.value)}
          className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 font-mono text-xs text-terminal-text outline-none focus:border-terminal-red"
        />
      </label>
    </div>
  );
}

function SavedBidCard({ bid, snapshot }: { bid: MockBid; snapshot?: TeamMarketSnapshot }) {
  const price = bid.limitPrice ?? calculateReferencePrice(bid.probabilityAtBid, bid.side);
  const size = bid.shareSize ?? (price > 0 ? bid.stake / price : 0);
  const orderId = bid.simulatedOrderId ?? bid.id;

  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
            {bid.orderType ?? "GTC"} / {bid.side.toUpperCase()} / {bid.tradeSide ?? "buy"} / simulated
          </p>
          <h3 className="mt-2 text-lg font-semibold text-terminal-text">{snapshot?.team.name ?? bid.teamId}</h3>
        </div>
        <p className="text-sm font-semibold text-terminal-green">${bid.potentialReturn.toFixed(2)}</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <ScenarioMetric label="Cost" value={`$${(bid.estimatedCost ?? bid.stake).toFixed(2)}`} />
        <ScenarioMetric label="Price" value={formatPriceCents(price)} />
        <ScenarioMetric label="Size" value={formatShareSize(size)} />
        <ScenarioMetric label="Status" value={bid.status} />
      </div>
      <p className="mt-4 break-all font-mono text-[11px] leading-5 text-terminal-muted">{orderId}</p>
    </article>
  );
}

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-terminal-line bg-black/30 p-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              value === option.value
                ? "rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green"
                : "rounded border border-transparent px-4 py-3 text-sm font-semibold text-terminal-muted transition hover:border-terminal-line hover:text-terminal-text"
            }
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TicketRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-terminal-panel2 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-terminal-text">{value}</p>
    </div>
  );
}

function CodeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className="mt-2 break-all font-mono text-xs leading-5 text-terminal-text">{value}</p>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
      <h3 className="text-lg font-semibold text-terminal-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-terminal-muted">{detail}</p>
    </div>
  );
}

function TopLinks({ source }: { source: MarketDataMeta["source"] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-terminal-muted">
      <Link href={`/?source=${source}`} className="hover:text-terminal-cyan">
        Market
      </Link>
      <Link href={`/feed?source=${source}`} className="hover:text-terminal-cyan">
        Feed
      </Link>
      <Link href={`/watchlist?source=${source}`} className="hover:text-terminal-cyan">
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

function getRealOrderDisabledReason(
  preview: BidOrderPreview | null,
  tradingConfig: TradingConfigStatus | null,
  confirmationText: string,
): string | undefined {
  if (!preview) {
    return "No order preview is available.";
  }

  if (!preview.canSubmitRealOrder) {
    return preview.disabledReason ?? "This order cannot be submitted.";
  }

  if (!tradingConfig?.ready) {
    return tradingConfig ? `Missing ${tradingConfig.missing.join(", ")}` : "Checking server trading configuration.";
  }

  if (confirmationText !== REAL_ORDER_CONFIRMATION) {
    return `Type ${REAL_ORDER_CONFIRMATION} to enable submit.`;
  }

  return undefined;
}
