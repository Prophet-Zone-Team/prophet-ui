"use client";

import { useEffect, useMemo, useState } from "react";

import { buildBidOrderPreview } from "../../lib/market/polymarketOrder";
import {
  calculateReferencePrice,
  formatTradePanelPrice
} from "../../lib/market/orderMath";
import {
  attachUserOrderSignature,
  buildUserOrderSignablePayload
} from "../../lib/market/userOrder";
import { formatProbability } from "../../components/home/market-formatters";
import { cn } from "../../lib/cn";
import { fetchJson } from "../../lib/team/clientFetch";
import { formatTeamDetailMoney } from "../../lib/team/detailFormat";
import { signTypedData } from "../../lib/team/walletSign";
import type {
  OrderOutcomeSide,
  TeamMarketSnapshot,
  TradingUserSession,
  UserOrderPreview,
  UserTradingReadiness
} from "../../types/market";
import {
  connectTradingWallet,
  formatShortWalletAddress,
  loadTradingSession
} from "../../components/trading/tradingWalletSession";
import {
  tradeBidButtonClass,
  tradeQuickAmountClass
} from "./tradeUi";

type TradeTicketStatus =
  | "idle"
  | "loading"
  | "signing"
  | "submitting"
  | "success"
  | "error";

interface TradingConfig {
  builderCode?: string;
}

interface TypedDataPayload {
  domain: unknown;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
}

const QUICK_AMOUNTS = [10, 50, 100] as const;

export interface BuyPanelProps {
  snapshot: TeamMarketSnapshot;
  outcomeSide: OrderOutcomeSide;
  onOutcomeSideChange: (side: OrderOutcomeSide) => void;
}

export function BuyPanel({
  snapshot,
  outcomeSide,
  onOutcomeSideChange
}: BuyPanelProps) {
  const yesPrice = snapshot.market.probability;
  const noPrice = Math.max(0, 100 - yesPrice);
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [readiness, setReadiness] = useState<UserTradingReadiness | undefined>();
  const [config, setConfig] = useState<TradingConfig | undefined>();
  const [amount, setAmount] = useState("100");
  const [limitPrice, setLimitPrice] = useState(() =>
    getDefaultLimitPrice(snapshot, "yes").toFixed(3)
  );
  const [status, setStatus] = useState<TradeTicketStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();

  const numericAmount = Number(amount);
  const numericLimitPrice = Number(limitPrice);
  const orderAmount = Number.isFinite(numericAmount)
    ? Math.max(0, numericAmount)
    : 0;
  const orderLimitPrice = Number.isFinite(numericLimitPrice)
    ? numericLimitPrice
    : getDefaultLimitPrice(snapshot, outcomeSide);

  const preview = useMemo(
    () =>
      buildBidOrderPreview({
        snapshot,
        outcomeSide,
        tradeSide: "buy",
        amount: orderAmount,
        limitPrice: orderLimitPrice,
        orderType: "FAK"
      }),
    [orderAmount, orderLimitPrice, outcomeSide, snapshot]
  );

  const failedChecks =
    readiness?.checks.filter((check) => check.status === "fail") ?? [];
  const canSubmit =
    Boolean(session) &&
    readiness?.ready === true &&
    preview.canSubmitRealOrder &&
    status !== "loading" &&
    status !== "signing" &&
    status !== "submitting";

  const yesTokenPrice =
    snapshot.market.polymarket?.tokens.yes?.price ??
    calculateReferencePrice(snapshot.market.probability, "yes");
  const noTokenPrice =
    snapshot.market.polymarket?.tokens.no?.price ??
    calculateReferencePrice(snapshot.market.probability, "no");

  useEffect(() => {
    let ignore = false;

    async function loadTicketState() {
      setStatus("loading");

      try {
        const [loadedSession, loadedConfig] = await Promise.all([
          loadTradingSession(),
          fetchJson<TradingConfig>("/api/trading/config")
        ]);

        if (ignore) {
          return;
        }

        setSession(loadedSession);
        setConfig(loadedConfig);
        setStatus("idle");
      } catch (error) {
        if (!ignore) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadTicketState();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadReadiness() {
      try {
        const query = new URLSearchParams({
          tradeSide: "buy",
          cost: String(preview.estimatedCost),
          size: String(preview.shareSize),
          totalCost: String(preview.estimatedTotalCost),
          estimatedTakerFee: String(preview.estimatedTakerFee)
        });

        if (preview.tokenId) {
          query.set("tokenId", preview.tokenId);
        }

        const nextReadiness = await fetchJson<UserTradingReadiness>(
          `/api/trading/readiness?${query.toString()}`
        );

        if (!ignore) {
          setReadiness(nextReadiness);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadReadiness();

    return () => {
      ignore = true;
    };
  }, [
    preview.estimatedCost,
    preview.estimatedTakerFee,
    preview.estimatedTotalCost,
    preview.shareSize,
    preview.tokenId
  ]);

  async function connectWallet() {
    setStatus("loading");
    setMessage(undefined);

    try {
      const nextSession = await connectTradingWallet();
      setSession(nextSession);
      setReadiness(await loadReadinessForPreview(preview));
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function deriveCredentials() {
    if (!session) {
      return;
    }

    setStatus("signing");
    setMessage(
      "Sign the CLOB auth message in your wallet to derive user-specific API credentials."
    );

    try {
      const { challenge } = await fetchJson<{ challenge: TypedDataPayload }>(
        "/api/trading/credentials",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "challenge" })
        }
      );
      const signature = await signTypedData(session.walletAddress, challenge);
      const response = await fetchJson<{ credentials?: unknown }>(
        "/api/trading/credentials",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature,
            timestamp: String(challenge.message.timestamp ?? ""),
            nonce: String(challenge.message.nonce ?? "0")
          })
        }
      );

      if (!response.credentials) {
        throw new Error("User CLOB credentials were not returned.");
      }

      setReadiness(await loadReadinessForPreview(preview));
      setStatus("idle");
      setMessage("Trading credentials are ready for this connected account.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function submitRealBid() {
    if (!session?.funderAddress || !preview.tokenId) {
      setStatus("error");
      setMessage(
        "A connected wallet, deployed deposit wallet, and Polymarket token are required."
      );
      return;
    }

    setStatus("signing");
    setMessage("Review and sign the Polymarket order in your wallet.");

    try {
      const signable = buildUserOrderSignablePayload({
        preview,
        walletAddress: session.walletAddress,
        funderAddress: session.funderAddress,
        orderType: "FAK",
        builderCode: config?.builderCode
      });
      const signature = await signTypedData(session.walletAddress, signable);
      const signedOrder = attachUserOrderSignature({
        signable,
        signature: signature as `0x${string}`
      });

      setStatus("submitting");
      setMessage("Submitting signed order to Polymarket CLOB.");

      await fetchJson<{ order?: unknown }>("/api/trading/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...signedOrder,
          preview: buildUserOrderPreview(snapshot, preview)
        })
      });

      setStatus("success");
      setMessage("Order submitted with your wallet signature.");
      setReadiness(await loadReadinessForPreview(preview));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function applyQuickAmount(value: number | "all") {
    if (value === "all") {
      const balance = readiness?.balances?.clobUsdcAvailable;

      if (balance !== undefined && balance > 0) {
        setAmount(String(Math.floor(balance)));
      }

      return;
    }

    setAmount(String(value));
    setMessage(undefined);
  }

  function selectOutcome(side: OrderOutcomeSide) {
    onOutcomeSideChange(side);
    setLimitPrice(getDefaultLimitPrice(snapshot, side).toFixed(3));
    setMessage(undefined);
  }

  const bidLabel =
    outcomeSide === "yes" ? "Bid for Yes" : "Bid for No";

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
      <div className="grid grid-cols-2 gap-2">
        <OutcomeButton
          side="yes"
          active={outcomeSide === "yes"}
          priceLabel={formatTradePanelPrice(yesTokenPrice)}
          probabilityLabel={formatProbability(yesPrice)}
          onSelect={() => selectOutcome("yes")}
        />
        <OutcomeButton
          side="no"
          active={outcomeSide === "no"}
          priceLabel={formatTradePanelPrice(noTokenPrice)}
          probabilityLabel={formatProbability(noPrice)}
          onSelect={() => selectOutcome("no")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-[556] leading-[17px] text-black">
            Amount
          </span>
          <label className="sr-only" htmlFor="trade-amount">
            Order amount in USDC
          </label>
          <div className="flex min-w-0 items-baseline justify-end">
            <span className="text-[32px] font-[556] leading-[38px] text-black">
              $
            </span>
            <input
              id="trade-amount"
              type="number"
              min={0}
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setMessage(undefined);
              }}
              className="min-w-[3ch] max-w-[8ch] flex-1 border-0 bg-transparent p-0 text-right text-[32px] font-[556] leading-[38px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              className={tradeQuickAmountClass}
              onClick={() => applyQuickAmount(value)}
            >
              +{value}
            </button>
          ))}
          <button
            type="button"
            className={tradeQuickAmountClass}
            onClick={() => applyQuickAmount("all")}
          >
            All-in
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-[556] leading-[17px] text-black">
            To Win
          </span>
          <span className="text-sm font-[457] leading-[17px] text-prophet-muted">
            Avg. Price {formatTradePanelPrice(preview.sidePrice)}
          </span>
        </div>
        <span className="text-[32px] font-[556] leading-[38px] text-[#69C800]">
          {formatTeamDetailMoney(preview.potentialOutcome)}
        </span>
      </div>

      {!session ? (
        <button
          type="button"
          className={tradeBidButtonClass}
          disabled={status === "loading"}
          onClick={() => void connectWallet()}
        >
          {status === "loading" ? "Connecting…" : "Connect Wallet"}
        </button>
      ) : readiness?.credentials.hasClobCredentials === false ? (
        <button
          type="button"
          className={tradeBidButtonClass}
          disabled={status === "signing"}
          onClick={() => void deriveCredentials()}
        >
          {status === "signing"
            ? "Waiting for signature…"
            : "Enable Trading Credentials"}
        </button>
      ) : (
        <button
          type="button"
          className={tradeBidButtonClass}
          disabled={!canSubmit}
          onClick={() => void submitRealBid()}
        >
          {status === "signing"
            ? "Waiting for signature…"
            : status === "submitting"
              ? "Submitting…"
              : bidLabel}
        </button>
      )}

      {session ? (
        <p className="m-0 text-center text-xs text-prophet-muted">
          {formatShortWalletAddress(session.walletAddress)}
        </p>
      ) : null}

      {message ? (
        <p
          className={cn(
            "m-0 text-xs",
            status === "error" ? "text-prophet-red" : "text-prophet-muted"
          )}
        >
          {message}
        </p>
      ) : null}

      {failedChecks.length > 0 ? (
        <ul className="m-0 list-none space-y-1 p-0 text-xs text-prophet-muted">
          {failedChecks.slice(0, 2).map((check) => (
            <li key={check.id}>
              {check.label}: {check.detail}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="m-0 text-[11px] leading-relaxed text-prophet-muted">
        Real orders use your connected wallet, deposit wallet, credentials, and
        explicit signature. Analytical context only — not financial advice.
      </p>
    </div>
  );
}

function OutcomeButton({
  side,
  active,
  priceLabel,
  probabilityLabel,
  onSelect
}: {
  side: OrderOutcomeSide;
  active: boolean;
  priceLabel: string;
  probabilityLabel: string;
  onSelect: () => void;
}) {
  const isYes = side === "yes";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-20 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 transition-colors",
        active
          ? isYes
            ? "border-[#65AF14] bg-[#65AF14] text-white"
            : "border-[#FF674B] bg-[#FF674B] text-white"
          : isYes
            ? "border-prophet-line bg-white text-[#65AF14] hover:bg-[#fafbfc]"
            : "border-[#FF674B] bg-white text-[#FF674B] hover:bg-[#fafbfc]"
      )}
    >
      <span className="text-xl font-[556] leading-6">
        {isYes ? "Yes" : "No"}
      </span>
      <span
        className={cn(
          "text-lg font-[556] leading-[21px]",
          active ? "text-white" : "inherit"
        )}
      >
        {priceLabel}
      </span>
      <span
        className={cn(
          "text-xs font-[556] leading-[14px]",
          active ? "text-white" : "inherit"
        )}
      >
        {probabilityLabel}
      </span>
    </button>
  );
}

function getDefaultLimitPrice(
  snapshot: TeamMarketSnapshot,
  outcomeSide: OrderOutcomeSide
) {
  return (
    snapshot.market.polymarket?.tokens[outcomeSide]?.price ??
    calculateReferencePrice(snapshot.market.probability, outcomeSide)
  );
}

async function loadReadinessForPreview(
  preview: ReturnType<typeof buildBidOrderPreview>
) {
  const query = new URLSearchParams({
    tradeSide: "buy",
    cost: String(preview.estimatedCost),
    size: String(preview.shareSize),
    totalCost: String(preview.estimatedTotalCost),
    estimatedTakerFee: String(preview.estimatedTakerFee)
  });

  if (preview.tokenId) {
    query.set("tokenId", preview.tokenId);
  }

  return fetchJson<UserTradingReadiness>(
    `/api/trading/readiness?${query.toString()}`
  );
}

function buildUserOrderPreview(
  snapshot: TeamMarketSnapshot,
  preview: ReturnType<typeof buildBidOrderPreview>
): UserOrderPreview {
  if (!preview.tokenId) {
    throw new Error("A Polymarket token ID is required before submitting.");
  }

  return {
    marketId:
      snapshot.market.polymarket?.marketId ??
      snapshot.market.polymarket?.conditionId,
    tokenId: preview.tokenId,
    teamId: snapshot.team.id,
    outcome: preview.outcomeSide,
    side: preview.tradeSide,
    orderType: "FAK",
    limitPrice: preview.sidePrice,
    size: preview.shareSize,
    estimatedCost: preview.estimatedCost,
    estimatedTakerFee: preview.estimatedTakerFee,
    estimatedTotalCost: preview.estimatedTotalCost,
    potentialOutcome: preview.potentialOutcome,
    tickSize: preview.tickSize ?? "0.01",
    negRisk: preview.negRisk,
    stale: false,
    warnings: preview.disabledReason ? [preview.disabledReason] : []
  };
}
