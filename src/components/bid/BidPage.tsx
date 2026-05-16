"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import type { Hex } from "viem";

import type { MarketDataMeta } from "../../data/providers/types";
import { DEFAULT_DEPOSIT_ASSET, POLYGON_NETWORK } from "../../lib/market/depositAssets";
import {
  calculateOutcomeReferencePrice,
  calculateReferencePrice,
  formatPriceCents,
  formatPayoutOdds,
  formatShareSize,
  normalizeLimitPrice,
} from "../../lib/market/orderMath";
import { buildBidOrderPreview, type BidOrderPreview } from "../../lib/market/polymarketOrder";
import {
  attachUserOrderSignature,
  buildUserOrderSignablePayload,
  recoverUserOrderSignerAddress,
} from "../../lib/market/userOrder";
import type { DepositWalletBatchSignablePayload } from "../../lib/market/depositWalletBatch";
import type {
  BidTradeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot,
  TradingOrderType,
  TradingUserSession,
  UserOrderRecord,
  UserOrderPreview,
  UserPositionRecord,
  UserTradingCredentialStatus,
  UserTradingReadiness,
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

const DEFAULT_ORDER_TYPE: TradingOrderType = "FAK";
const DEFAULT_SIGNATURE_TYPE = 3;
const DEFAULT_DEPOSIT_AMOUNT = "5";
const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isMetaMask?: boolean;
}

interface UserOpenOrder {
  id: string;
  status: string;
  market: string;
  asset_id: string;
  side: string;
  price: string;
  original_size: string;
  size_matched: string;
  outcome: string;
  created_at: number;
  order_type: string;
}

interface ReadinessOrderFunding {
  tokenId?: string;
  tradeSide?: BidTradeSide;
  estimatedCost?: number;
  shareSize?: number;
  estimatedTakerFee?: number;
  estimatedTotalCost?: number;
}

interface DepositAddressState {
  evm?: string;
  svm?: string;
  btc?: string;
  tron?: string;
  tvm?: string;
  funderAddress?: string;
}

export function BidPage({ snapshots, dataStatus }: BidPageProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(snapshots[0]?.team.id ?? "");
  const [amount, setAmount] = useState("100");
  const [outcomeSide, setOutcomeSide] = useState<OrderOutcomeSide>("yes");
  const [tradeSide, setTradeSide] = useState<BidTradeSide>("buy");
  const [limitPriceCents, setLimitPriceCents] = useState("0");
  const [tradingSession, setTradingSession] = useState<TradingUserSession | undefined>();
  const [readiness, setReadiness] = useState<UserTradingReadiness | null>(null);
  const [funderAddress, setFunderAddress] = useState("");
  const [walletStatus, setWalletStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [walletMessage, setWalletMessage] = useState<string | undefined>();
  const [credentialStatus, setCredentialStatus] = useState<UserTradingCredentialStatus | null>(null);
  const [credentialState, setCredentialState] = useState<"idle" | "signing" | "ready" | "error">("idle");
  const [approvalState, setApprovalState] = useState<"idle" | "signing" | "submitted" | "syncing" | "synced" | "error">("idle");
  const [accountPrepState, setAccountPrepState] = useState<"idle" | "running" | "ready" | "needs_funds" | "blocked" | "error">("idle");
  const [depositAddressState, setDepositAddressState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [depositAddress, setDepositAddress] = useState<DepositAddressState | null>(null);
  const [depositAmount, setDepositAmount] = useState(DEFAULT_DEPOSIT_AMOUNT);
  const [depositTxState, setDepositTxState] = useState<"idle" | "switching" | "signing" | "submitted" | "settled" | "error">("idle");
  const [depositTxHash, setDepositTxHash] = useState<string | undefined>();
  const [orderSignState, setOrderSignState] = useState<"idle" | "signing" | "ready" | "error">("idle");
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<UserOrderRecord[]>([]);
  const [openOrdersState, setOpenOrdersState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [openOrdersMessage, setOpenOrdersMessage] = useState<string | undefined>();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [positionsState, setPositionsState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [positionsMessage, setPositionsMessage] = useState<string | undefined>();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | undefined>();
  const [cancelState, setCancelState] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | undefined>();

  useEffect(() => {
    let ignore = false;

    fetch("/api/trading/session")
      .then((response) => response.json() as Promise<{ session?: TradingUserSession }>)
      .then((payload) => {
        if (!ignore && payload.session) {
          setTradingSession(payload.session);
          setFunderAddress(payload.session.funderAddress ?? "");
          setWalletStatus("connected");
        }
      })
      .catch(() => undefined);

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
        orderType: DEFAULT_ORDER_TYPE,
      })
    : null;
  const readinessTokenId = preview?.tokenId;
  const readinessTradeSide = preview?.tradeSide;
  const readinessEstimatedCost = preview?.estimatedCost;
  const readinessShareSize = preview?.shareSize;
  const readinessEstimatedTakerFee = preview?.estimatedTakerFee;
  const readinessEstimatedTotalCost = preview?.estimatedTotalCost;
  const userOrderDisabledReason = getUserOrderDisabledReason(preview, readiness);
  const canSubmitUserOrder = Boolean(!userOrderDisabledReason && preview);

  useEffect(() => {
    void loadReadiness(
      {
        tokenId: readinessTokenId,
        tradeSide: readinessTradeSide,
        estimatedCost: readinessEstimatedCost,
        shareSize: readinessShareSize,
        estimatedTakerFee: readinessEstimatedTakerFee,
        estimatedTotalCost: readinessEstimatedTotalCost,
      },
      {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      },
    );
  }, [
    readinessTokenId,
    readinessTradeSide,
    readinessEstimatedCost,
    readinessShareSize,
    readinessEstimatedTakerFee,
    readinessEstimatedTotalCost,
    tradingSession?.userId,
    credentialStatus?.hasClobCredentials,
  ]);

  useEffect(() => {
    setOrderSignState("idle");
    setSubmitState("idle");
    setSubmitMessage(undefined);
  }, [selectedTeamId, outcomeSide, tradeSide, amount, limitPriceCents, tradingSession?.userId, funderAddress]);

  useEffect(() => {
    if (!readiness?.credentials.hasClobCredentials) {
      return;
    }

    void loadUserOpenOrders(preview?.tokenId, {
      onState: setOpenOrdersState,
      onMessage: setOpenOrdersMessage,
      onOrders: setOpenOrders,
      onHistory: setOrderHistory,
    });
    void loadUserPositions({
      onState: setPositionsState,
      onMessage: setPositionsMessage,
      onPositions: setPositions,
    });
  }, [readiness?.credentials.hasClobCredentials, preview?.tokenId]);

  async function connectWallet() {
    setWalletStatus("connecting");
    setWalletMessage(undefined);

    try {
      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("No injected wallet provider found.");
      }

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      const walletAddress = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : undefined;

      if (!walletAddress) {
        throw new Error("Wallet did not return an account.");
      }

      const response = await fetch("/api/trading/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          signatureType: DEFAULT_SIGNATURE_TYPE,
        }),
      });
      const payload = (await response.json()) as { session?: TradingUserSession; error?: string };

      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? "Unable to create trading session.");
      }

      setTradingSession(payload.session);
      setFunderAddress(payload.session.funderAddress ?? "");
      setWalletStatus("connected");
      setWalletMessage(getWalletSessionMessage(payload.session));
      await loadReadiness(readinessFromPreview(preview), {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      });
      void loadDepositAddress({
        onState: setDepositAddressState,
        onDepositAddress: setDepositAddress,
        onMessage: setWalletMessage,
      });
    } catch (error) {
      setWalletStatus("error");
      setWalletMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function disconnectWallet() {
    await fetch("/api/trading/session", {
      method: "DELETE",
    }).catch(() => undefined);
    setTradingSession(undefined);
    setReadiness(null);
    setCredentialStatus(null);
    setApprovalState("idle");
    setAccountPrepState("idle");
    setDepositAddress(null);
    setDepositAddressState("idle");
    setDepositTxState("idle");
    setDepositTxHash(undefined);
    setOpenOrders([]);
    setOrderHistory([]);
    setPositions([]);
    setWalletStatus("idle");
    setWalletMessage("Trading session disconnected.");
  }

  async function prepareAccount() {
    setAccountPrepState("running");
    setWalletMessage(undefined);

    try {
      if (!tradingSession) {
        throw new Error("Connect a wallet before preparing the account.");
      }

      let currentReadiness = await loadReadiness(readinessFromPreview(preview), {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      });

      if (currentReadiness.session?.depositWalletStatus === "relayer_unconfigured") {
        throw new Error(
          currentReadiness.session.depositWalletError ??
            "Account setup needs app-managed Polymarket relayer credentials before first-time deposit wallets can be deployed.",
        );
      }

      if (!currentReadiness.credentials.hasClobCredentials) {
        await deriveCredentials();
        currentReadiness = await loadReadiness(readinessFromPreview(preview), {
          onReadiness: setReadiness,
          onSession: setTradingSession,
          onCredentials: setCredentialStatus,
          onFunderAddress: setFunderAddress,
        });

        if (!currentReadiness.credentials.hasClobCredentials) {
          throw new Error("Trading credentials were not saved after wallet signature. Try Enable trading again.");
        }
      }

      await loadDepositAddress({
        onState: setDepositAddressState,
        onDepositAddress: setDepositAddress,
        onMessage: setWalletMessage,
      });

      const failedAllowance = currentReadiness.checks.find((check) => check.id === "allowance" && check.status !== "pass");

      if (failedAllowance && currentReadiness.session?.depositWalletStatus === "deployed") {
        await approveTradingContracts();
        await syncBalances();
        currentReadiness = await loadReadiness(readinessFromPreview(preview), {
          onReadiness: setReadiness,
          onSession: setTradingSession,
          onCredentials: setCredentialStatus,
          onFunderAddress: setFunderAddress,
        });
      }

      if (failedAllowance && currentReadiness.session?.depositWalletStatus !== "deployed") {
        setAccountPrepState("blocked");
        setWalletMessage("Deposit wallet is still being deployed. Refresh account readiness in a few seconds.");
        return;
      }

      const failedBalance = currentReadiness.checks.find((check) => check.id === "balance" && check.status !== "pass");
      const remainingBlocker = currentReadiness.checks.find((check) => check.status === "fail");

      if (failedBalance) {
        setAccountPrepState("needs_funds");
        setWalletMessage("Account prepared. Deposit funds with the generated address, then refresh account readiness.");
        return;
      }

      if (remainingBlocker) {
        setAccountPrepState("blocked");
        setWalletMessage(`${remainingBlocker.label}: ${remainingBlocker.detail}`);
        return;
      }

      setAccountPrepState("ready");
      setWalletMessage("Account is ready for order signing.");
    } catch (error) {
      setAccountPrepState("error");
      setWalletMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function deriveCredentials() {
    setCredentialState("signing");
    setWalletMessage(undefined);

    try {
      if (!tradingSession) {
        throw new Error("Connect a wallet before deriving user CLOB credentials.");
      }

      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("No injected wallet provider found.");
      }

      await ensurePolygonNetwork(provider);
      const walletAddress = await requireActiveSessionWallet(provider, tradingSession);

      const challengeResponse = await fetch("/api/trading/credentials", {
        cache: "no-store",
      });
      const challengePayload = (await challengeResponse.json()) as {
        challenge?: {
          domain: unknown;
          types: Record<string, unknown>;
          primaryType: string;
          message: {
            timestamp?: string;
            nonce?: string;
          };
        };
        error?: string;
      };

      if (!challengeResponse.ok || !challengePayload.challenge) {
        throw new Error(challengePayload.error ?? "Unable to create CLOB auth challenge.");
      }

      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [walletAddress, JSON.stringify(challengePayload.challenge)],
      });

      if (typeof signature !== "string") {
        throw new Error("Wallet did not return a signature.");
      }

      const response = await fetch("/api/trading/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "derive",
          signature,
          timestamp: challengePayload.challenge.message.timestamp,
          nonce: normalizeWalletNonce(challengePayload.challenge.message.nonce),
        }),
      });
      const payload = (await response.json()) as { credentials?: UserTradingCredentialStatus; error?: string };

      if (!response.ok || !payload.credentials) {
        throw new Error(payload.error ?? "Unable to derive user CLOB credentials.");
      }

      setCredentialStatus(payload.credentials);
      setCredentialState("ready");
      await loadReadiness(readinessFromPreview(preview), {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      });
    } catch (error) {
      setCredentialState("error");
      setWalletMessage(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async function approveTradingContracts() {
    setApprovalState("signing");
    setWalletMessage(undefined);

    try {
      if (!tradingSession) {
        throw new Error("Connect a wallet before preparing the account.");
      }

      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("No injected wallet provider found.");
      }

      await ensurePolygonNetwork(provider);
      const walletAddress = await requireActiveSessionWallet(provider, tradingSession);

      const response = await fetch("/api/trading/approvals", {
        cache: "no-store",
      });
      const payload = (await response.json()) as { approval?: DepositWalletBatchSignablePayload; error?: string };

      if (!response.ok || !payload.approval) {
        throw new Error(payload.error ?? "Unable to create deposit wallet approval batch.");
      }

      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [
          walletAddress,
          JSON.stringify({
            domain: payload.approval.domain,
            types: payload.approval.types,
            primaryType: payload.approval.primaryType,
            message: payload.approval.message,
          }),
        ],
      });

      if (typeof signature !== "string") {
        throw new Error("Wallet did not return an approval signature.");
      }

      const submitResponse = await fetch("/api/trading/approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          nonce: payload.approval.nonce,
          deadline: payload.approval.deadline,
        }),
      });
      const submitPayload = (await submitResponse.json()) as {
        error?: string;
        response?: { transactionID?: string; transactionHash?: string; hash?: string };
        submittedAt?: string;
      };

      if (!submitResponse.ok) {
        throw new Error(submitPayload.error ?? "Unable to submit deposit wallet approvals.");
      }

      setApprovalState("submitted");
      const transactionRef =
        submitPayload.response?.transactionHash ?? submitPayload.response?.hash ?? submitPayload.response?.transactionID;
      setWalletMessage(
        transactionRef
          ? `Account approval submitted (${transactionRef}).`
          : `Account approval submitted at ${submitPayload.submittedAt ?? new Date().toISOString()}.`,
      );
      await loadReadiness(readinessFromPreview(preview), {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      });
    } catch (error) {
      setApprovalState("error");
      setWalletMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function syncBalances() {
    setApprovalState("syncing");
    setWalletMessage(undefined);

    try {
      const tokenId = preview?.tokenId;
      const response = await fetch("/api/trading/balance-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tokenId ? { tokenId } : {}),
      });
      const payload = (await response.json()) as { error?: string; syncedAt?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to sync CLOB balance and allowance.");
      }

      setApprovalState("synced");
      setWalletMessage(`Balance and allowance cache synced at ${payload.syncedAt ?? new Date().toISOString()}.`);
      await loadReadiness(readinessFromPreview(preview), {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      });
    } catch (error) {
      setApprovalState("error");
      setWalletMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshAccountReadiness() {
    if (readiness?.credentials.hasClobCredentials) {
      await syncBalances();
      return;
    }

    await loadReadiness(readinessFromPreview(preview), {
      onReadiness: setReadiness,
      onSession: setTradingSession,
      onCredentials: setCredentialStatus,
      onFunderAddress: setFunderAddress,
    });
  }

  async function depositFunds() {
    setDepositTxState("switching");
    setWalletMessage(undefined);

    try {
      if (!tradingSession) {
        throw new Error("Connect a wallet before depositing funds.");
      }

      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("No injected wallet provider found.");
      }

      let currentDepositAddress = depositAddress;

      if (!currentDepositAddress?.evm) {
        currentDepositAddress = await loadDepositAddress({
          onState: setDepositAddressState,
          onDepositAddress: setDepositAddress,
          onMessage: setWalletMessage,
        });
      }

      if (!currentDepositAddress?.evm) {
        throw new Error("Enable trading before depositing funds.");
      }

      const normalizedAmount = depositAmount.trim();
      const numericDepositAmount = Number(normalizedAmount);

      if (!Number.isFinite(numericDepositAmount) || numericDepositAmount < DEFAULT_DEPOSIT_ASSET.minimumAmount) {
        throw new Error(`Deposit at least ${DEFAULT_DEPOSIT_ASSET.minimumAmount} ${DEFAULT_DEPOSIT_ASSET.symbol}.`);
      }

      await ensurePolygonNetwork(provider);
      const walletAddress = await requireActiveSessionWallet(provider, tradingSession);
      setDepositTxState("signing");

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: DEFAULT_DEPOSIT_ASSET.address,
            value: "0x0",
            data: encodeFunctionData({
              abi: ERC20_TRANSFER_ABI,
              functionName: "transfer",
              args: [
                currentDepositAddress.evm as Hex,
                parseUnits(normalizedAmount, DEFAULT_DEPOSIT_ASSET.decimals),
              ],
            }),
          },
        ],
      });

      if (typeof txHash !== "string") {
        throw new Error("Wallet did not return a deposit transaction hash.");
      }

      setDepositTxHash(txHash);
      setDepositTxState("submitted");
      setWalletMessage(`Deposit transaction submitted (${formatHash(txHash)}). Waiting for wallet confirmation.`);

      const confirmed = await waitForTransactionReceipt(provider, txHash);

      if (confirmed) {
        setDepositTxState("settled");
        setWalletMessage("Deposit transaction confirmed. Refreshing account readiness.");
      } else {
        setWalletMessage("Deposit transaction submitted. Refresh account readiness after the bridge settlement completes.");
      }

      if (readiness?.credentials.hasClobCredentials) {
        await syncBalances();
      }

      await loadReadiness(readinessFromPreview(preview), {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      });
    } catch (error) {
      setDepositTxState("error");
      setWalletMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function buildSignedUserOrderPayload() {
    if (!selectedSnapshot || !preview || !tradingSession) {
      setOrderSignState("error");
      setSubmitMessage("Connect a wallet and choose a valid market before signing.");
      return undefined;
    }

    const sessionFunderAddress = tradingSession.funderAddress ?? funderAddress;

    if (!sessionFunderAddress) {
      setOrderSignState("error");
      setSubmitMessage("The user's Polymarket deposit wallet is not ready.");
      return undefined;
    }

    setOrderSignState("signing");
    setSubmitMessage(undefined);

    try {
      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("No injected wallet provider found.");
      }

      await ensurePolygonNetwork(provider);
      const walletAddress = await requireActiveSessionWallet(provider, tradingSession);
      const builderCode = await loadTradingBuilderCode();
      const signable = buildUserOrderSignablePayload({
        preview,
        walletAddress,
        funderAddress: sessionFunderAddress,
        orderType: DEFAULT_ORDER_TYPE,
        builderCode,
      });
      const typedData = {
        domain: signable.domain,
        types: signable.types,
        primaryType: signable.primaryType,
        message: signable.message,
      };
      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [walletAddress, JSON.stringify(typedData)],
      });

      if (typeof signature !== "string") {
        throw new Error("Wallet did not return an order signature.");
      }

      const recoveredAddress = await recoverUserOrderSignerAddress({
        signable,
        signature: signature as Hex,
      });

      if (!addressesEqual(recoveredAddress, walletAddress)) {
        throw new Error(
          `Order signature recovered ${formatHash(recoveredAddress)}, which does not match active wallet ${formatHash(
            walletAddress,
          )}.`,
        );
      }

      const signedPayload = attachUserOrderSignature({
        signable,
        signature: signature as Hex,
      });

      setOrderSignState("ready");
      return signedPayload;
    } catch (error) {
      setOrderSignState("error");
      setSubmitMessage(error instanceof Error ? error.message : String(error));
      return undefined;
    }
  }

  async function cancelUserOrder(orderId: string) {
    setCancelState("submitting");
    setCancellingOrderId(orderId);
    setOpenOrdersMessage(undefined);

    try {
      const response = await fetch("/api/trading/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });
      const payload = (await response.json()) as { error?: string; cancelledAt?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to cancel order.");
      }

      setCancelState("submitted");
      setOpenOrdersMessage(`Cancellation submitted at ${payload.cancelledAt ?? new Date().toISOString()}.`);
      await loadUserOpenOrders(preview?.tokenId, {
        onState: setOpenOrdersState,
        onMessage: setOpenOrdersMessage,
        onOrders: setOpenOrders,
        onHistory: setOrderHistory,
      });
    } catch (error) {
      setCancelState("error");
      setOpenOrdersMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setCancellingOrderId(undefined);
    }
  }

  async function submitUserOrder() {
    if (!tradingSession) {
      await connectWallet();
      return;
    }

    if (!selectedSnapshot || !preview || !canSubmitUserOrder) {
      setSubmitState("error");
      setSubmitMessage(userOrderDisabledReason ?? "Order is not ready.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage(undefined);

    try {
      const signedPayload = await buildSignedUserOrderPayload();

      if (!signedPayload) {
        setSubmitState("error");
        return;
      }

      const response = await fetch("/api/trading/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...signedPayload,
          preview: toUserOrderPreview(preview, selectedSnapshot),
        }),
      });
      const payload = (await response.json()) as { error?: string; response?: unknown; submittedAt?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Polymarket CLOB order failed.");
      }

      setSubmitState("submitted");
      setSubmitMessage(`Order submitted at ${payload.submittedAt ?? new Date().toISOString()}.`);
      await loadUserOpenOrders(preview.tokenId, {
        onState: setOpenOrdersState,
        onMessage: setOpenOrdersMessage,
        onOrders: setOpenOrders,
        onHistory: setOrderHistory,
      });
      await loadUserPositions({
        onState: setPositionsState,
        onMessage: setPositionsMessage,
        onPositions: setPositions,
      });
      await loadReadiness(readinessFromPreview(preview), {
        onReadiness: setReadiness,
        onSession: setTradingSession,
        onCredentials: setCredentialStatus,
        onFunderAddress: setFunderAddress,
      });
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(getReadableErrorMessage(error));
    }
  }

  return (
    <main className="terminal-grid min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:gap-10">
        <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal sm:p-8 lg:p-10">
          <TopLinks
            source={dataStatus.source}
            session={tradingSession}
            walletStatus={walletStatus}
            onConnectWallet={connectWallet}
          />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Trading desk</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
                Trade Ticket
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
                Build a World Cup Polymarket order preview, connect a user wallet, enable trading when needed, and place
                the order after the wallet signature is confirmed.
              </p>
              <p className="mt-5 rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 p-4 text-sm leading-6 text-terminal-amber">
                Live orders can move the connected user&apos;s funds or positions on Polymarket. Market data and order
                previews are analytical context, not financial, betting, or investment advice.
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
              description="Configure a user-owned Polymarket order. Orders use immediate-or-cancel execution and require a wallet signature before submission."
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

              <div className="grid gap-6 sm:grid-cols-2">
                <SegmentedControl
                  label="Outcome"
                  options={[
                    { value: "yes", label: "YES" },
                    { value: "no", label: "NO" },
                  ]}
                  value={outcomeSide}
                  onChange={(value) => setOutcomeSide(value as OrderOutcomeSide)}
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

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block" htmlFor="bid-amount">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
                    {tradeSide === "buy" ? "Amount USDC" : "Shares to sell"}
                  </span>
                  <input
                    id="bid-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 text-terminal-text outline-none focus:border-terminal-cyan"
                  />
                  {tradeSide === "buy" ? (
                    <span className="mt-2 block text-xs leading-5 text-terminal-muted">
                      Treated as a total USDC budget including estimated taker fees.
                    </span>
                  ) : null}
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

              <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <ScenarioMetric
                    label="Reference"
                    value={selectedSnapshot ? formatPriceCents(referencePrice) : "0.0c"}
                  />
                  <ScenarioMetric label="Limit" value={formatPriceCents(limitPrice)} />
                  <ScenarioMetric label="Size" value={preview ? formatShareSize(preview.shareSize) : "0"} />
                  <ScenarioMetric
                    label={tradeSide === "buy" ? "Estimated total" : "Estimated proceeds"}
                    value={
                      preview
                        ? `$${(tradeSide === "buy" ? preview.estimatedTotalCost : preview.potentialOutcome).toFixed(2)}`
                        : "$0.00"
                    }
                    tone={preview && preview.potentialOutcome >= 0 ? "text-terminal-green" : "text-terminal-red"}
                  />
                </div>
                <button
                  type="button"
                  onClick={submitUserOrder}
                  disabled={walletStatus === "connecting" || (Boolean(tradingSession) && (!canSubmitUserOrder || submitState === "submitting"))}
                  className="mt-6 w-full rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
                >
                  {!tradingSession
                    ? walletStatus === "connecting"
                      ? "Connecting wallet..."
                      : "Connect wallet"
                    : submitState === "submitting"
                      ? orderSignState === "signing"
                        ? "Waiting for wallet signature..."
                        : "Placing order..."
                      : submitState === "submitted"
                        ? "Order submitted"
                        : "Place order"}
                </button>
                {submitMessage ? (
                  <p className={submitState === "error" ? "mt-4 text-xs leading-5 text-terminal-red" : "mt-4 text-xs leading-5 text-terminal-green"}>
                    {submitMessage}
                  </p>
                ) : (
                  <p className="mt-4 text-xs leading-5 text-terminal-muted">
                    Your wallet will ask for an order signature. The ticket submits automatically after the signature is confirmed.
                  </p>
                )}
              </div>

              {tradingSession && !canSubmitUserOrder ? (
                <UserTradingSetup
                  session={tradingSession}
                  readiness={readiness}
                  funderAddress={funderAddress}
                  walletMessage={walletMessage}
                  credentialState={credentialState}
                  approvalState={approvalState}
                  accountPrepState={accountPrepState}
                  depositAddressState={depositAddressState}
                  depositAddress={depositAddress}
                  depositAmount={depositAmount}
                  depositTxState={depositTxState}
                  depositTxHash={depositTxHash}
                  orderSignState={orderSignState}
                  disabledReason={userOrderDisabledReason}
                  onDisconnectWallet={disconnectWallet}
                  onPrepareAccount={prepareAccount}
                  onDepositAmountChange={setDepositAmount}
                  onDepositFunds={depositFunds}
                  onRefresh={() => void refreshAccountReadiness()}
                  canSubmitOrder={Boolean(canSubmitUserOrder)}
                  submitState={submitState}
                />
              ) : null}
            </div>
          </section>

          <div className="grid gap-8">
            <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
              <SectionHeader eyebrow="Ticket preview" title="CLOB Order Ticket" />
              {selectedSnapshot && preview ? (
                <OrderPreview
                  snapshot={selectedSnapshot}
                  preview={preview}
                  orderType={DEFAULT_ORDER_TYPE}
                />
              ) : (
                <EmptyState title="No market selected" detail="Choose a team to preview an order ticket." />
              )}
            </section>

            <UserOrderManagement
              orders={openOrders}
              history={orderHistory}
              state={openOrdersState}
              message={openOrdersMessage}
              cancellingOrderId={cancellingOrderId}
              cancelState={cancelState}
              onRefresh={() =>
                void loadUserOpenOrders(preview?.tokenId, {
                  onState: setOpenOrdersState,
                  onMessage: setOpenOrdersMessage,
                  onOrders: setOpenOrders,
                  onHistory: setOrderHistory,
                })
              }
              onCancelOrder={cancelUserOrder}
            />
            <UserPositionsPanel
              positions={positions}
              state={positionsState}
              message={positionsMessage}
              onRefresh={() =>
                void loadUserPositions({
                  onState: setPositionsState,
                  onMessage: setPositionsMessage,
                  onPositions: setPositions,
                })
              }
            />
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
  side: OrderOutcomeSide;
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
            {team.code} / {team.region}
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
}: {
  snapshot: TeamMarketSnapshot;
  preview: BidOrderPreview;
  orderType: TradingOrderType;
}) {
  return (
    <div className="mt-8">
      <div className="rounded-lg border border-terminal-red/45 bg-terminal-red/10 p-4 text-sm leading-6 text-terminal-red">
        This ticket can submit a real user-owned CLOB order after the connected wallet signs the order.
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-terminal-line bg-terminal-panel2/75">
        <div className="border-b border-terminal-line bg-black/25 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Market</p>
          <h3 className="mt-2 text-xl font-semibold text-terminal-text">
            {snapshot.team.name} {preview.outcomeSide.toUpperCase()} / {preview.tradeSide.toUpperCase()}
          </h3>
        </div>
        <div className="grid gap-px bg-terminal-line sm:grid-cols-2">
          <TicketRow label="Order type" value={orderType} />
          <TicketRow label="Payout odds" value={formatPayoutOdds(preview.potentialPayout, preview.estimatedTotalCost)} />
          <TicketRow label="Limit price" value={formatPriceCents(preview.sidePrice)} />
          <TicketRow label="Order cost" value={`$${preview.estimatedCost.toFixed(2)}`} />
          <TicketRow label="Estimated taker fee" value={`$${preview.estimatedTakerFee.toFixed(2)}`} />
          <TicketRow label="Estimated total debit" value={`$${preview.estimatedTotalCost.toFixed(2)}`} />
          <TicketRow label="Size" value={formatShareSize(preview.shareSize)} />
          <TicketRow label="Potential payout" value={`$${preview.potentialPayout.toFixed(2)}`} />
          <TicketRow label="Potential outcome" value={`$${preview.potentialOutcome.toFixed(2)}`} />
          <TicketRow label="Accepting orders" value={preview.acceptingOrders ? "Yes" : "No"} />
        </div>
        <div className="grid gap-4 p-5">
          <CodeMetric label="Order signer scope" value="Connected user session" />
          <CodeMetric label="Token id" value={preview.tokenId ?? "Missing"} />
          <CodeMetric label="Tick / neg risk" value={`${preview.tickSize ?? "n/a"} / ${preview.negRisk ? "yes" : "no"}`} />
          <CodeMetric
            label="Fee model"
            value={
              preview.estimatedTakerFee > 0
                ? "CLOB taker fees are estimated and included in the total debit budget."
                : "No taker fee estimate is available for this ticket."
            }
          />
          <CodeMetric label="Order id" value="Created after CLOB submission" />
        </div>
      </div>
    </div>
  );
}

function UserTradingSetup({
  session,
  readiness,
  funderAddress,
  walletMessage,
  credentialState,
  approvalState,
  accountPrepState,
  depositAddressState,
  depositAddress,
  depositAmount,
  depositTxState,
  depositTxHash,
  orderSignState,
  disabledReason,
  onDisconnectWallet,
  onPrepareAccount,
  onDepositAmountChange,
  onDepositFunds,
  onRefresh,
  canSubmitOrder,
  submitState,
}: {
  session?: TradingUserSession;
  readiness: UserTradingReadiness | null;
  funderAddress: string;
  walletMessage?: string;
  credentialState: "idle" | "signing" | "ready" | "error";
  approvalState: "idle" | "signing" | "submitted" | "syncing" | "synced" | "error";
  accountPrepState: "idle" | "running" | "ready" | "needs_funds" | "blocked" | "error";
  depositAddressState: "idle" | "loading" | "ready" | "error";
  depositAddress: DepositAddressState | null;
  depositAmount: string;
  depositTxState: "idle" | "switching" | "signing" | "submitted" | "settled" | "error";
  depositTxHash?: string;
  orderSignState: "idle" | "signing" | "ready" | "error";
  disabledReason?: string;
  onDisconnectWallet: () => void;
  onPrepareAccount: () => void;
  onDepositAmountChange: (value: string) => void;
  onDepositFunds: () => void;
  onRefresh: () => void;
  canSubmitOrder: boolean;
  submitState: "idle" | "submitting" | "submitted" | "error";
}) {
  const readinessSummary = getReadinessSummary({
    session,
    readiness,
    accountPrepState,
    credentialState,
    approvalState,
    depositTxState,
    canSubmitOrder,
    disabledReason,
  });
  const needsEnableTrading = Boolean(
    session &&
      accountPrepState !== "running" &&
      (!readiness?.credentials.hasClobCredentials ||
        readiness.checks.some((check) => check.status !== "pass" && check.id !== "balance")),
  );
  const refreshLabel = readiness?.credentials.hasClobCredentials ? "Sync balances" : "Refresh";
  const showDeposit = Boolean(
    session &&
      (accountPrepState === "needs_funds" ||
        readiness?.checks.some((check) => check.id === "balance" && check.status !== "pass")),
  );
  const canEnableTrading = Boolean(session && accountPrepState !== "running");
  const depositNetworkAddress = depositAddress?.evm ?? depositAddress?.svm ?? depositAddress?.btc ?? depositAddress?.tron ?? depositAddress?.tvm;
  const canDeposit =
    Boolean(session && depositAddress?.evm) &&
    !["switching", "signing", "submitted"].includes(depositTxState);

  return (
    <div className="rounded-lg border border-terminal-cyan/35 bg-terminal-cyan/8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-cyan">Trading account</p>
          <p className="mt-3 text-sm leading-6 text-terminal-muted">
            Connect a wallet, enable trading once, then place orders with a wallet signature.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded border border-terminal-line px-3 py-2 text-xs text-terminal-muted transition hover:border-terminal-cyan hover:text-terminal-cyan"
        >
          {refreshLabel}
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <div className={readinessSummary.className}>
          <p className="text-[10px] uppercase tracking-[0.22em] text-current">{readinessSummary.eyebrow}</p>
          <p className="mt-2 text-lg font-semibold text-terminal-text">{readinessSummary.title}</p>
          <p className="mt-2 text-sm leading-6 text-terminal-muted">{readinessSummary.detail}</p>
          {readinessSummary.issue ? (
            <p className="mt-3 rounded border border-current/35 bg-black/20 px-3 py-2 text-xs leading-5 text-current">
              {readinessSummary.issue}
            </p>
          ) : null}
          {session ? (
            <p className="mt-3 break-all font-mono text-xs leading-5 text-terminal-muted">
              {formatHash(session.walletAddress)}
              {funderAddress ? ` / ${formatHash(funderAddress)}` : ""}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {session ? (
            <button
              type="button"
              onClick={onDisconnectWallet}
              disabled={submitState === "submitting"}
              className="rounded border border-terminal-line px-4 py-3 text-sm font-semibold text-terminal-muted transition hover:border-terminal-cyan hover:text-terminal-cyan disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
            >
              Disconnect wallet
            </button>
          ) : null}
          {needsEnableTrading ? (
            <button
              type="button"
              onClick={onPrepareAccount}
              disabled={!canEnableTrading || submitState === "submitting"}
              className="rounded border border-terminal-cyan/60 bg-terminal-cyan/10 px-4 py-3 text-sm font-semibold text-terminal-cyan transition hover:bg-terminal-cyan/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
            >
              {accountPrepState === "running"
                ? approvalState === "signing"
                  ? "Approve in wallet..."
                  : credentialState === "signing"
                    ? "Sign to enable..."
                    : "Enabling trading..."
                : "Enable trading"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onRefresh}
              disabled={!session || submitState === "submitting"}
              className="rounded border border-terminal-line px-4 py-3 text-sm font-semibold text-terminal-muted transition hover:border-terminal-cyan hover:text-terminal-cyan disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
            >
              {refreshLabel}
            </button>
          )}
        </div>

        <details className="rounded border border-terminal-line bg-terminal-panel2/75 p-4">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
            Advanced details
          </summary>
          <div className="mt-4 grid gap-3">
            <CodeMetric label="Connected wallet" value={session?.walletAddress ?? "Not connected"} />
            <CodeMetric label="Deposit wallet" value={funderAddress || "Pending"} />
            <CodeMetric label="Deposit status" value={session?.depositWalletStatus ?? "unknown"} />
            <CodeMetric
              label="Account state"
              value={`${accountPrepState} / auth ${credentialState} / approval ${approvalState} / deposit ${depositTxState}`}
            />
            <CodeMetric label="Session type" value={session ? `signature type ${session.signatureType}` : "none"} />
          </div>
        </details>

        {showDeposit ? (
          <div className="rounded border border-terminal-line bg-terminal-panel2/75 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Deposit address</p>
              <span className={depositAddressState === "ready" ? "text-xs text-terminal-green" : "text-xs text-terminal-muted"}>
                {depositAddressState === "loading" ? "loading" : depositAddressState}
              </span>
            </div>
            <p className="mt-3 break-all font-mono text-xs leading-5 text-terminal-text">
              {depositNetworkAddress ?? "Enable trading to generate a deposit address."}
            </p>
            <p className="mt-2 text-xs leading-5 text-terminal-muted">
              This address credits the user-owned Polymarket account after the transfer settles.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="block" htmlFor="deposit-amount">
                <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
                  Deposit {DEFAULT_DEPOSIT_ASSET.symbol}
                </span>
                <div className="mt-2 flex rounded border border-terminal-line bg-terminal-black focus-within:border-terminal-cyan">
                  <input
                    id="deposit-amount"
                    type="number"
                    min={DEFAULT_DEPOSIT_ASSET.minimumAmount}
                    step="0.01"
                    value={depositAmount}
                    onChange={(event) => onDepositAmountChange(event.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-sm text-terminal-text outline-none"
                  />
                  <span className="border-l border-terminal-line px-3 py-2 text-xs text-terminal-muted">
                    {DEFAULT_DEPOSIT_ASSET.symbol}
                  </span>
                </div>
              </label>
              <button
                type="button"
                onClick={onDepositFunds}
                disabled={!canDeposit}
                className="self-end rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-2.5 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
              >
                {depositTxState === "switching"
                  ? "Switching..."
                  : depositTxState === "signing"
                    ? "Confirming..."
                    : depositTxState === "submitted"
                      ? "Submitted"
                      : "Deposit USDC"}
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-terminal-muted">
              Uses {DEFAULT_DEPOSIT_ASSET.symbol} on {DEFAULT_DEPOSIT_ASSET.chainName}. The wallet will ask the user to
              switch network and confirm the transfer.
            </p>
            {depositTxHash ? <CodeMetric label="Deposit transaction" value={depositTxHash} /> : null}
          </div>
        ) : null}

        {walletMessage ? <p className="text-xs leading-5 text-terminal-muted">{walletMessage}</p> : null}
        {disabledReason && session && !canSubmitOrder ? <p className="text-sm leading-6 text-terminal-red">{disabledReason}</p> : null}
        {orderSignState === "ready" && submitState === "submitting" ? (
          <p className="text-xs leading-5 text-terminal-green">Signature received. Submitting order...</p>
        ) : null}
      </div>
    </div>
  );
}

function UserOrderManagement({
  orders,
  history,
  state,
  message,
  cancellingOrderId,
  cancelState,
  onRefresh,
  onCancelOrder,
}: {
  orders: UserOpenOrder[];
  history: UserOrderRecord[];
  state: "idle" | "loading" | "ready" | "error";
  message?: string;
  cancellingOrderId?: string;
  cancelState: "idle" | "submitting" | "submitted" | "error";
  onRefresh: () => void;
  onCancelOrder: (orderId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Orders"
          title="Recent Orders"
          description="Open orders for the selected market appear here after submission or refresh."
        />
        <button
          type="button"
          onClick={onRefresh}
          className="rounded border border-terminal-line px-3 py-2 text-xs text-terminal-muted transition hover:border-terminal-cyan hover:text-terminal-cyan"
        >
          Refresh
        </button>
      </div>
      <div className="mt-8 grid gap-4">
        {state === "loading" ? (
          <EmptyState title="Loading orders" detail="Checking active orders for the selected market." />
        ) : orders.length > 0 ? (
          orders.slice(0, 6).map((order) => (
            <UserOpenOrderCard
              key={order.id}
              order={order}
              cancelState={cancelState}
              isCancelling={cancellingOrderId === order.id}
              onCancelOrder={onCancelOrder}
            />
          ))
        ) : (
          <EmptyState
            title="No recent orders"
            detail="Submitted FAK orders may fill or expire immediately. Refresh after placing an order to check active CLOB orders."
          />
        )}
      </div>
      {history.length > 0 ? (
        <div className="mt-6 border-t border-terminal-line pt-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Persisted history</p>
          <div className="mt-4 grid gap-3">
            {history.slice(0, 5).map((order) => (
              <UserOrderHistoryRow key={order.id} order={order} />
            ))}
          </div>
        </div>
      ) : null}
      {message ? (
        <p className={state === "error" || cancelState === "error" ? "mt-4 text-xs leading-5 text-terminal-red" : "mt-4 text-xs leading-5 text-terminal-green"}>
          {message}
        </p>
      ) : null}
    </section>
  );
}

function UserOrderHistoryRow({ order }: { order: UserOrderRecord }) {
  return (
    <div className="grid gap-3 rounded border border-terminal-line bg-terminal-panel2/65 p-4 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm font-semibold text-terminal-text">
          {order.preview.teamId.toUpperCase()} {order.preview.outcome.toUpperCase()} / {order.preview.side.toUpperCase()}
        </p>
        <p className="mt-1 break-all font-mono text-[11px] leading-5 text-terminal-muted">
          {order.clobOrderId ?? order.id}
        </p>
      </div>
      <div className="sm:text-right">
        <p className={getOrderStatusClassName(order.status)}>{order.status.replace(/_/g, " ")}</p>
        <p className="mt-1 text-xs text-terminal-muted">{order.updatedAt}</p>
      </div>
    </div>
  );
}

function UserPositionsPanel({
  positions,
  state,
  message,
  onRefresh,
}: {
  positions: UserPositionRecord[];
  state: "idle" | "loading" | "ready" | "error";
  message?: string;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Positions"
          title="User Positions"
          description="Current Polymarket positions are fetched for the connected user account when available."
        />
        <button
          type="button"
          onClick={onRefresh}
          className="rounded border border-terminal-line px-3 py-2 text-xs text-terminal-muted transition hover:border-terminal-cyan hover:text-terminal-cyan"
        >
          Refresh
        </button>
      </div>
      <div className="mt-8 grid gap-4">
        {state === "loading" ? (
          <EmptyState title="Loading positions" detail="Checking current Polymarket positions for the connected account." />
        ) : positions.length > 0 ? (
          positions.slice(0, 6).map((position) => <UserPositionCard key={`${position.conditionId}:${position.asset}`} position={position} />)
        ) : (
          <EmptyState title="No positions" detail="No current positions were returned for the connected Polymarket account." />
        )}
      </div>
      {message ? (
        <p className={state === "error" ? "mt-4 text-xs leading-5 text-terminal-red" : "mt-4 text-xs leading-5 text-terminal-muted"}>
          {message}
        </p>
      ) : null}
    </section>
  );
}

function UserPositionCard({ position }: { position: UserPositionRecord }) {
  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{position.outcome}</p>
          <h3 className="mt-2 text-lg font-semibold text-terminal-text">{position.title}</h3>
        </div>
        <p className={position.cashPnl >= 0 ? "text-sm font-semibold text-terminal-green" : "text-sm font-semibold text-terminal-red"}>
          {formatSignedMoney(position.cashPnl)}
        </p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <ScenarioMetric label="Size" value={formatShareSize(position.size)} />
        <ScenarioMetric label="Avg price" value={formatPriceCents(position.avgPrice)} />
        <ScenarioMetric label="Current value" value={`$${position.currentValue.toFixed(2)}`} />
      </div>
    </article>
  );
}

function UserOpenOrderCard({
  order,
  cancelState,
  isCancelling,
  onCancelOrder,
}: {
  order: UserOpenOrder;
  cancelState: "idle" | "submitting" | "submitted" | "error";
  isCancelling: boolean;
  onCancelOrder: (orderId: string) => void;
}) {
  const canCancel = isCancellableOrder(order);

  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
            {order.order_type} / {order.side} / {order.status}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-terminal-text">{order.outcome || order.asset_id}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-terminal-cyan">{Number(order.price).toFixed(3)}</p>
          {canCancel ? (
            <button
              type="button"
              onClick={() => onCancelOrder(order.id)}
              disabled={cancelState === "submitting"}
              className="rounded border border-terminal-red/60 bg-terminal-red/10 px-3 py-2 text-xs font-semibold text-terminal-red transition hover:bg-terminal-red/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
            >
              {isCancelling ? "Cancelling..." : "Cancel"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <ScenarioMetric label="Original size" value={order.original_size} />
        <ScenarioMetric label="Matched" value={order.size_matched} />
        <ScenarioMetric label="Created" value={formatUnixSeconds(order.created_at)} />
      </div>
      <p className="mt-4 break-all font-mono text-[11px] leading-5 text-terminal-muted">{order.id}</p>
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

function TopLinks({
  source,
  session,
  walletStatus,
  onConnectWallet,
}: {
  source: MarketDataMeta["source"];
  session?: TradingUserSession;
  walletStatus: "idle" | "connecting" | "connected" | "error";
  onConnectWallet: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
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
      <div className="flex items-center gap-2">
        {session ? (
          <div className="rounded border border-terminal-green/45 bg-terminal-green/10 px-3 py-2 text-xs text-terminal-green">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-terminal-green" />
            <span className="font-mono">{formatHash(session.walletAddress)}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnectWallet}
            disabled={walletStatus === "connecting"}
            className="rounded border border-terminal-green/60 bg-terminal-green/12 px-3 py-2 text-xs font-semibold text-terminal-green transition hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
          >
            {walletStatus === "connecting" ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>
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

function getUserOrderDisabledReason(
  preview: BidOrderPreview | null,
  readiness: UserTradingReadiness | null,
): string | undefined {
  if (!preview) {
    return "No order preview is available.";
  }

  if (!preview.canSubmitRealOrder) {
    return preview.disabledReason ?? "This order cannot be submitted.";
  }

  if (!readiness?.session) {
    return "Connect a user wallet before order submission.";
  }

  if (!readiness.credentials.hasClobCredentials) {
    return "Enable trading before placing an order.";
  }

  if (!readiness.ready) {
    const failedCheck = readiness.checks.find((check) => check.status !== "pass");
    return failedCheck ? `${failedCheck.label}: ${failedCheck.detail}` : "Trading readiness checks are incomplete.";
  }

  return undefined;
}

function toUserOrderPreview(preview: BidOrderPreview, snapshot: TeamMarketSnapshot): UserOrderPreview {
  return {
    marketId: snapshot.market.polymarket?.marketId,
    tokenId: preview.tokenId ?? "",
    teamId: snapshot.team.id,
    outcome: preview.outcomeSide,
    side: preview.tradeSide,
    orderType: preview.orderType,
    limitPrice: preview.sidePrice,
    size: preview.shareSize,
    estimatedCost: preview.estimatedCost,
    estimatedTakerFee: preview.estimatedTakerFee,
    estimatedTotalCost: preview.estimatedTotalCost,
    estimatedProceeds: preview.tradeSide === "sell" ? preview.potentialOutcome : undefined,
    potentialOutcome: preview.potentialOutcome,
    tickSize: preview.tickSize ?? "0.01",
    negRisk: preview.negRisk,
    stale: false,
    warnings: preview.disabledReason ? [preview.disabledReason] : [],
  };
}

function getReadinessSummary({
  session,
  readiness,
  accountPrepState,
  credentialState,
  approvalState,
  depositTxState,
  canSubmitOrder,
  disabledReason,
}: {
  session?: TradingUserSession;
  readiness: UserTradingReadiness | null;
  accountPrepState: "idle" | "running" | "ready" | "needs_funds" | "blocked" | "error";
  credentialState: "idle" | "signing" | "ready" | "error";
  approvalState: "idle" | "signing" | "submitted" | "syncing" | "synced" | "error";
  depositTxState: "idle" | "switching" | "signing" | "submitted" | "settled" | "error";
  canSubmitOrder: boolean;
  disabledReason?: string;
}) {
  const baseClass = "rounded border p-4";

  if (!session) {
    return {
      eyebrow: "Wallet required",
      title: "Connect your wallet",
      detail: "Connect a compatible wallet to check trading access and prepare the Polymarket account.",
      className: `${baseClass} border-terminal-line bg-terminal-panel2/75 text-terminal-muted`,
    };
  }

  if (depositTxState === "switching" || depositTxState === "signing" || depositTxState === "submitted") {
    return {
      eyebrow: "Deposit pending",
      title: "Confirming USDC deposit",
      detail: "The wallet or network is processing the transfer. Refresh account readiness after settlement.",
      className: `${baseClass} border-terminal-amber/45 bg-terminal-amber/10 text-terminal-amber`,
    };
  }

  if (accountPrepState === "running") {
    const title =
      approvalState === "signing"
        ? "Approve trading in your wallet"
        : credentialState === "signing"
          ? "Sign to enable trading"
          : "Enabling trading";

    return {
      eyebrow: "Wallet action",
      title,
      detail: "Complete the wallet prompt. This setup is usually only needed once per wallet session or after permissions change.",
      className: `${baseClass} border-terminal-cyan/45 bg-terminal-cyan/10 text-terminal-cyan`,
    };
  }

  const failedCheck = readiness?.checks.find((check) => check.status === "fail");
  const unknownCheck = readiness?.checks.find((check) => check.status === "unknown");
  const blockingCheck = failedCheck ?? unknownCheck;

  if (blockingCheck?.id === "eligibility") {
    return {
      eyebrow: "Unavailable",
      title: "Trading is not available",
      detail: "Polymarket access is unavailable for the current session.",
      issue: blockingCheck.detail,
      className: `${baseClass} border-terminal-red/45 bg-terminal-red/10 text-terminal-red`,
    };
  }

  if (blockingCheck?.id === "balance") {
    return {
      eyebrow: "Funds required",
      title: "Add USDC to continue",
      detail: "Your Polymarket account needs enough USDC for the order amount and estimated fees.",
      issue: blockingCheck.detail,
      className: `${baseClass} border-terminal-amber/45 bg-terminal-amber/10 text-terminal-amber`,
    };
  }

  if (blockingCheck && blockingCheck.id !== "allowance") {
    return {
      eyebrow: "Action required",
      title: blockingCheck.id === "clob_credentials" ? "Enable trading" : "Account setup required",
      detail: "Complete the account setup step before placing an order.",
      issue: disabledReason ?? blockingCheck.detail,
      className: `${baseClass} border-terminal-amber/45 bg-terminal-amber/10 text-terminal-amber`,
    };
  }

  if (blockingCheck?.id === "allowance") {
    return {
      eyebrow: "Approval required",
      title: "Approve trading",
      detail: "Approve the Polymarket account permissions before placing an order.",
      issue: blockingCheck.detail,
      className: `${baseClass} border-terminal-amber/45 bg-terminal-amber/10 text-terminal-amber`,
    };
  }

  if (canSubmitOrder || readiness?.ready) {
    return {
      eyebrow: "Ready",
      title: "Ready to place order",
      detail: "Your wallet and Polymarket account checks passed. The next wallet prompt signs this order.",
      className: `${baseClass} border-terminal-green/45 bg-terminal-green/10 text-terminal-green`,
    };
  }

  if (accountPrepState === "error") {
    return {
      eyebrow: "Setup failed",
      title: "Account setup needs attention",
      detail: "Retry account setup or refresh the wallet session.",
      issue: disabledReason,
      className: `${baseClass} border-terminal-red/45 bg-terminal-red/10 text-terminal-red`,
    };
  }

  return {
    eyebrow: "Checking",
    title: "Checking account readiness",
    detail: "The ticket is checking wallet access, Polymarket eligibility, funds, and permissions.",
    className: `${baseClass} border-terminal-line bg-terminal-panel2/75 text-terminal-muted`,
  };
}

function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const maybeWindow = window as typeof window & {
    ethereum?: EthereumProvider & { providers?: EthereumProvider[] };
    okxwallet?: EthereumProvider;
  };

  if (maybeWindow.okxwallet) {
    return maybeWindow.okxwallet;
  }

  const providers = maybeWindow.ethereum?.providers;
  const okxProvider = providers?.find((provider) => provider.isOkxWallet || provider.isOKExWallet);

  return okxProvider ?? maybeWindow.ethereum;
}

function getWalletSessionMessage(session: TradingUserSession) {
  if (session.depositWalletStatus === "deployed") {
    return "Wallet connected. Polymarket account is ready for account checks.";
  }

  if (session.depositWalletStatus === "deploying") {
    return "Wallet connected. Polymarket account setup is pending; refresh in a few seconds.";
  }

  if (session.depositWalletStatus === "relayer_unconfigured") {
    return "Wallet connected. First-time Polymarket account setup needs app-managed relayer credentials.";
  }

  if (session.depositWalletStatus === "error") {
    return session.depositWalletError ?? "Wallet connected, but Polymarket account setup failed.";
  }

  return "Wallet connected. Polymarket account address was derived.";
}

async function loadReadiness(
  funding: ReadinessOrderFunding | undefined,
  handlers: {
    onReadiness: (value: UserTradingReadiness) => void;
    onSession: (value: TradingUserSession | undefined) => void;
    onCredentials: (value: UserTradingCredentialStatus) => void;
    onFunderAddress: (value: string) => void;
  },
) {
  const searchParams = new URLSearchParams();

  if (funding?.tokenId) {
    searchParams.set("tokenId", funding.tokenId);
  }

  if (
    funding?.tradeSide &&
    funding.estimatedCost !== undefined &&
    funding.shareSize !== undefined
  ) {
    searchParams.set("tradeSide", funding.tradeSide);
    searchParams.set("cost", funding.estimatedCost.toString());
    searchParams.set("size", funding.shareSize.toString());

    if (funding.estimatedTotalCost !== undefined) {
      searchParams.set("totalCost", funding.estimatedTotalCost.toString());
    }

    if (funding.estimatedTakerFee !== undefined) {
      searchParams.set("estimatedTakerFee", funding.estimatedTakerFee.toString());
    }
  }

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  const url = `/api/trading/readiness${query}`;
  const response = await fetch(url);
  const payload = (await response.json()) as UserTradingReadiness;

  handlers.onReadiness(payload);
  handlers.onSession(payload.session);
  handlers.onCredentials(payload.credentials);

  if (payload.session?.funderAddress) {
    handlers.onFunderAddress(payload.session.funderAddress);
  }

  return payload;
}

async function loadDepositAddress(handlers: {
  onState: (value: "idle" | "loading" | "ready" | "error") => void;
  onDepositAddress: (value: DepositAddressState | null) => void;
  onMessage: (value: string | undefined) => void;
}): Promise<DepositAddressState | null> {
  handlers.onState("loading");

  try {
    const response = await fetch("/api/trading/deposit", {
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      deposit?: {
        address?: DepositAddressState;
      };
      funderAddress?: string;
      error?: string;
    };

    if (!response.ok || !payload.deposit?.address) {
      throw new Error(payload.error ?? "Unable to create a deposit address.");
    }

    const depositAddressValue = {
      ...payload.deposit.address,
      funderAddress: payload.funderAddress,
    };

    handlers.onDepositAddress(depositAddressValue);
    handlers.onState("ready");

    return depositAddressValue;
  } catch (error) {
    handlers.onDepositAddress(null);
    handlers.onState("error");
    handlers.onMessage(error instanceof Error ? error.message : String(error));

    return null;
  }
}

async function loadTradingBuilderCode() {
  const response = await fetch("/api/trading/config", {
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    builderCode?: string;
    builderTakerFeeRate?: number;
    error?: string;
  };

  if (!response.ok || !payload.builderCode) {
    throw new Error(payload.error ?? "Unable to load Polymarket builder configuration.");
  }

  return payload.builderCode;
}

async function getCurrentWalletAddress(provider: EthereumProvider): Promise<string | undefined> {
  const accounts = await provider.request({
    method: "eth_accounts",
  });

  return Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : undefined;
}

async function requireActiveSessionWallet(provider: EthereumProvider, session: TradingUserSession) {
  const currentWalletAddress = await getCurrentWalletAddress(provider);

  if (!currentWalletAddress) {
    throw new Error("Wallet is locked or disconnected. Reconnect the wallet before continuing.");
  }

  if (!addressesEqual(currentWalletAddress, session.walletAddress)) {
    throw new Error(
      `Active wallet ${formatHash(currentWalletAddress)} does not match this trading session ${formatHash(
        session.walletAddress,
      )}. Switch wallet accounts or disconnect and reconnect.`,
    );
  }

  return currentWalletAddress;
}

function addressesEqual(left: string | undefined, right: string | undefined) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function normalizeWalletNonce(value: string | number | undefined) {
  if (value === undefined || value === "") {
    return "0";
  }

  return value.toString();
}

function getReadableErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Request timed out before the order status could be confirmed. Refresh open orders before retrying.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function ensurePolygonNetwork(provider: EthereumProvider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: POLYGON_NETWORK.chainIdHex,
        },
      ],
    });
  } catch (error) {
    const maybeError = error as { code?: number | string };

    if (maybeError.code !== 4902 && maybeError.code !== "4902") {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: POLYGON_NETWORK.chainIdHex,
          chainName: POLYGON_NETWORK.chainName,
          nativeCurrency: POLYGON_NETWORK.nativeCurrency,
          rpcUrls: [...POLYGON_NETWORK.rpcUrls],
          blockExplorerUrls: [...POLYGON_NETWORK.blockExplorerUrls],
        },
      ],
    });
  }
}

async function waitForTransactionReceipt(provider: EthereumProvider, transactionHash: string) {
  for (let index = 0; index < 12; index += 1) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    });

    if (receipt && typeof receipt === "object") {
      return true;
    }

    await delay(5000);
  }

  return false;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatHash(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function isCancellableOrder(order: UserOpenOrder) {
  const status = order.status.toLowerCase();

  return status === "open" || status === "live" || status === "unmatched" || status === "partially_filled";
}

function readinessFromPreview(preview: BidOrderPreview | null): ReadinessOrderFunding | undefined {
  return preview
    ? {
        tokenId: preview.tokenId,
        tradeSide: preview.tradeSide,
        estimatedCost: preview.estimatedCost,
        shareSize: preview.shareSize,
        estimatedTakerFee: preview.estimatedTakerFee,
        estimatedTotalCost: preview.estimatedTotalCost,
      }
    : undefined;
}

async function loadUserOpenOrders(
  tokenId: string | undefined,
  handlers: {
    onState: (value: "idle" | "loading" | "ready" | "error") => void;
    onMessage: (value: string | undefined) => void;
    onOrders: (value: UserOpenOrder[]) => void;
    onHistory?: (value: UserOrderRecord[]) => void;
  },
) {
  handlers.onState("loading");
  handlers.onMessage(undefined);

  try {
    const url = tokenId ? `/api/trading/orders/open?tokenId=${encodeURIComponent(tokenId)}` : "/api/trading/orders/open";
    const response = await fetch(url);
    const payload = (await response.json()) as { orders?: UserOpenOrder[]; history?: UserOrderRecord[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to fetch open orders.");
    }

    handlers.onOrders(payload.orders ?? []);
    handlers.onHistory?.(payload.history ?? []);
    handlers.onState("ready");
  } catch (error) {
    handlers.onOrders([]);
    handlers.onState("error");
    handlers.onMessage(error instanceof Error ? error.message : String(error));
  }
}

async function loadUserPositions(handlers: {
  onState: (value: "idle" | "loading" | "ready" | "error") => void;
  onMessage: (value: string | undefined) => void;
  onPositions: (value: UserPositionRecord[]) => void;
}) {
  handlers.onState("loading");
  handlers.onMessage(undefined);

  try {
    const response = await fetch("/api/trading/positions?limit=50");
    const payload = (await response.json()) as { positions?: UserPositionRecord[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to fetch positions.");
    }

    handlers.onPositions(payload.positions ?? []);
    handlers.onState("ready");
  } catch (error) {
    handlers.onPositions([]);
    handlers.onState("error");
    handlers.onMessage(error instanceof Error ? error.message : String(error));
  }
}

function formatUnixSeconds(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "n/a";
  }

  return new Date(value * 1000).toISOString();
}

function getOrderStatusClassName(status: UserOrderRecord["status"]) {
  if (status === "filled" || status === "open" || status === "submitted") {
    return "text-xs font-semibold uppercase tracking-[0.18em] text-terminal-green";
  }

  if (status === "cancelled") {
    return "text-xs font-semibold uppercase tracking-[0.18em] text-terminal-muted";
  }

  return "text-xs font-semibold uppercase tracking-[0.18em] text-terminal-red";
}

function formatSignedMoney(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}
