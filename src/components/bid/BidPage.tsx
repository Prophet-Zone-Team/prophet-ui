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
  AccountReadinessCheck,
  BidTradeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot,
  TradingOrderType,
  TradingUserSession,
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

const ORDER_TYPES: TradingOrderType[] = ["GTC", "FOK", "FAK"];
const USER_ORDER_CONFIRMATION = "SUBMIT USER ORDER";
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
  const [orderType, setOrderType] = useState<TradingOrderType>("GTC");
  const [limitPriceCents, setLimitPriceCents] = useState("0");
  const [confirmationText, setConfirmationText] = useState("");
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
  const [signedOrderPayload, setSignedOrderPayload] = useState<unknown>();
  const [orderSignState, setOrderSignState] = useState<"idle" | "signing" | "ready" | "error">("idle");
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [openOrdersState, setOpenOrdersState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [openOrdersMessage, setOpenOrdersMessage] = useState<string | undefined>();
  const [cancelOrderId, setCancelOrderId] = useState("");
  const [cancelConfirmation, setCancelConfirmation] = useState("");
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
        orderType,
      })
    : null;
  const readinessTokenId = preview?.tokenId;
  const readinessTradeSide = preview?.tradeSide;
  const readinessEstimatedCost = preview?.estimatedCost;
  const readinessShareSize = preview?.shareSize;
  const readinessEstimatedTakerFee = preview?.estimatedTakerFee;
  const readinessEstimatedTotalCost = preview?.estimatedTotalCost;
  const userOrderDisabledReason = getUserOrderDisabledReason(preview, readiness, signedOrderPayload, confirmationText);
  const canSubmitUserOrder = !userOrderDisabledReason && preview && signedOrderPayload;

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
    setSignedOrderPayload(undefined);
    setOrderSignState("idle");
    setConfirmationText("");
  }, [selectedTeamId, outcomeSide, tradeSide, orderType, amount, limitPriceCents, tradingSession?.userId, funderAddress]);

  useEffect(() => {
    if (!readiness?.credentials.hasClobCredentials) {
      return;
    }

    void loadUserOpenOrders(preview?.tokenId, {
      onState: setOpenOrdersState,
      onMessage: setOpenOrdersMessage,
      onOrders: setOpenOrders,
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
    setSignedOrderPayload(undefined);
    setApprovalState("idle");
    setAccountPrepState("idle");
    setDepositAddress(null);
    setDepositAddressState("idle");
    setDepositTxState("idle");
    setDepositTxHash(undefined);
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
          throw new Error("User CLOB credentials were not saved after wallet signature. Try Prepare account again.");
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
        throw new Error("Prepare the account before depositing funds.");
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

  async function signUserOrder() {
    if (!selectedSnapshot || !preview || !tradingSession) {
      setOrderSignState("error");
      setSubmitMessage("Connect a wallet and choose a valid market before signing.");
      return;
    }

    const sessionFunderAddress = tradingSession.funderAddress ?? funderAddress;

    if (!sessionFunderAddress) {
      setOrderSignState("error");
      setSubmitMessage("The user's Polymarket deposit wallet is not ready.");
      return;
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
        orderType,
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

      setSignedOrderPayload(signedPayload);
      setOrderSignState("ready");
      setSubmitMessage("User order signed. Review the ticket and final confirmation before submit.");
    } catch (error) {
      setOrderSignState("error");
      setSubmitMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function cancelUserOrder() {
    setCancelState("submitting");
    setOpenOrdersMessage(undefined);

    try {
      const response = await fetch("/api/trading/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: cancelOrderId.trim(),
          finalConfirmation: cancelConfirmation,
        }),
      });
      const payload = (await response.json()) as { error?: string; cancelledAt?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to cancel order.");
      }

      setCancelState("submitted");
      setCancelConfirmation("");
      setOpenOrdersMessage(`Cancellation submitted at ${payload.cancelledAt ?? new Date().toISOString()}.`);
      await loadUserOpenOrders(preview?.tokenId, {
        onState: setOpenOrdersState,
        onMessage: setOpenOrdersMessage,
        onOrders: setOpenOrders,
      });
    } catch (error) {
      setCancelState("error");
      setOpenOrdersMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function submitUserOrder() {
    if (!selectedSnapshot || !preview || !canSubmitUserOrder) {
      setSubmitState("error");
      setSubmitMessage(userOrderDisabledReason ?? "Order is not ready.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage(undefined);

    try {
      const response = await fetch("/api/trading/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(signedOrderPayload as Record<string, unknown>),
          finalConfirmation: confirmationText,
        }),
      });
      const payload = (await response.json()) as { error?: string; response?: unknown; submittedAt?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Polymarket CLOB order failed.");
      }

      setSubmitState("submitted");
      setSubmitMessage(`User-owned order submitted at ${payload.submittedAt ?? new Date().toISOString()}.`);
      await loadUserOpenOrders(preview.tokenId, {
        onState: setOpenOrdersState,
        onMessage: setOpenOrdersMessage,
        onOrders: setOpenOrders,
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
          <TopLinks source={dataStatus.source} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Trading desk</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
                Trade Ticket
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
                Build a World Cup Polymarket order preview, connect a user wallet, check account readiness, and submit
                only after user-owned signatures and final review are complete.
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
              description="Configure a user-owned Polymarket order. Submission requires wallet connection, account readiness, order signature, and final confirmation."
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

              <UserTradingSetup
                session={tradingSession}
                readiness={readiness}
                funderAddress={funderAddress}
                walletStatus={walletStatus}
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
                hasSignedOrder={Boolean(signedOrderPayload)}
                disabledReason={userOrderDisabledReason}
                onConnectWallet={connectWallet}
                onDisconnectWallet={disconnectWallet}
                onPrepareAccount={prepareAccount}
                onDepositAmountChange={setDepositAmount}
                onDepositFunds={depositFunds}
                onSignOrder={signUserOrder}
                onSubmitOrder={submitUserOrder}
                onRefresh={() =>
                  void loadReadiness(readinessFromPreview(preview), {
                    onReadiness: setReadiness,
                    onSession: setTradingSession,
                    onCredentials: setCredentialStatus,
                    onFunderAddress: setFunderAddress,
                  })
                }
                confirmationText={confirmationText}
                onConfirmationTextChange={setConfirmationText}
                canSubmitOrder={Boolean(canSubmitUserOrder)}
                submitState={submitState}
              />

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
                  disabled={!canSubmitUserOrder || submitState === "submitting"}
                  className="mt-6 w-full rounded border border-terminal-red/60 bg-terminal-red/12 px-4 py-3 text-sm font-semibold text-terminal-red transition hover:bg-terminal-red/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
                >
                  {submitState === "submitting" ? "Submitting user order..." : "Submit user-owned order"}
                </button>
                {submitMessage ? (
                  <p className={submitState === "error" ? "mt-4 text-xs leading-5 text-terminal-red" : "mt-4 text-xs leading-5 text-terminal-green"}>
                    {submitMessage}
                  </p>
                ) : (
                  <p className="mt-4 text-xs leading-5 text-terminal-muted">
                    Orders require a connected user wallet, prepared account, a signed order payload, and final
                    confirmation.
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
                />
              ) : (
                <EmptyState title="No market selected" detail="Choose a team to preview an order ticket." />
              )}
            </section>

            <UserOrderManagement
              orders={openOrders}
              state={openOrdersState}
              message={openOrdersMessage}
              cancelOrderId={cancelOrderId}
              cancelConfirmation={cancelConfirmation}
              cancelState={cancelState}
              onRefresh={() =>
                void loadUserOpenOrders(preview?.tokenId, {
                  onState: setOpenOrdersState,
                  onMessage: setOpenOrdersMessage,
                  onOrders: setOpenOrders,
                })
              }
              onCancelOrderIdChange={setCancelOrderId}
              onCancelConfirmationChange={setCancelConfirmation}
              onCancelOrder={cancelUserOrder}
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
}: {
  snapshot: TeamMarketSnapshot;
  preview: BidOrderPreview;
  orderType: TradingOrderType;
}) {
  return (
    <div className="mt-8">
      <div className="rounded-lg border border-terminal-red/45 bg-terminal-red/10 p-4 text-sm leading-6 text-terminal-red">
        This ticket can submit a real user-owned CLOB order after wallet signature and final confirmation.
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
  walletStatus,
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
  hasSignedOrder,
  disabledReason,
  onConnectWallet,
  onDisconnectWallet,
  onPrepareAccount,
  onDepositAmountChange,
  onDepositFunds,
  onSignOrder,
  onSubmitOrder,
  onRefresh,
  confirmationText,
  onConfirmationTextChange,
  canSubmitOrder,
  submitState,
}: {
  session?: TradingUserSession;
  readiness: UserTradingReadiness | null;
  funderAddress: string;
  walletStatus: "idle" | "connecting" | "connected" | "error";
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
  hasSignedOrder: boolean;
  disabledReason?: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onPrepareAccount: () => void;
  onDepositAmountChange: (value: string) => void;
  onDepositFunds: () => void;
  onSignOrder: () => void;
  onSubmitOrder: () => void;
  onRefresh: () => void;
  confirmationText: string;
  onConfirmationTextChange: (value: string) => void;
  canSubmitOrder: boolean;
  submitState: "idle" | "submitting" | "submitted" | "error";
}) {
  const canPrepareAccount = Boolean(session && accountPrepState !== "running");
  const canSignOrder = Boolean(session && readiness?.ready && readiness.credentials.hasClobCredentials && funderAddress.trim());
  const depositNetworkAddress = depositAddress?.evm ?? depositAddress?.svm ?? depositAddress?.btc ?? depositAddress?.tron ?? depositAddress?.tvm;
  const canDeposit =
    Boolean(session && depositAddress?.evm) &&
    !["switching", "signing", "submitted"].includes(depositTxState);

  return (
    <div className="rounded-lg border border-terminal-cyan/35 bg-terminal-cyan/8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-cyan">User trading setup</p>
          <p className="mt-3 text-sm leading-6 text-terminal-muted">
            Connect once, then let the ticket prepare the user account before signing an order.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded border border-terminal-line px-3 py-2 text-xs text-terminal-muted transition hover:border-terminal-cyan hover:text-terminal-cyan"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded border border-terminal-line bg-terminal-panel2/75 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Polymarket deposit wallet</p>
          <p className="mt-2 break-all font-mono text-xs text-terminal-text">
            {funderAddress || "Connect a wallet to create the Polymarket account."}
          </p>
          <p className="mt-2 text-xs leading-5 text-terminal-muted">
            Funds and allowances are held by this user-owned Polymarket wallet.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={session ? onDisconnectWallet : onConnectWallet}
            disabled={walletStatus === "connecting"}
            className="rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
          >
            {walletStatus === "connecting"
              ? "Connecting..."
              : session
                ? "Disconnect wallet"
                : "Connect wallet"}
          </button>
          <button
            type="button"
            onClick={onPrepareAccount}
            disabled={!canPrepareAccount}
            className="rounded border border-terminal-cyan/60 bg-terminal-cyan/10 px-4 py-3 text-sm font-semibold text-terminal-cyan transition hover:bg-terminal-cyan/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
          >
            {accountPrepState === "running" ? "Preparing account..." : accountPrepState === "ready" ? "Refresh account" : "Prepare account"}
          </button>
        </div>

        <div className="rounded border border-terminal-line bg-terminal-panel2/75 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Deposit address</p>
            <span className={depositAddressState === "ready" ? "text-xs text-terminal-green" : "text-xs text-terminal-muted"}>
              {depositAddressState === "loading" ? "loading" : depositAddressState}
            </span>
          </div>
          <p className="mt-3 break-all font-mono text-xs leading-5 text-terminal-text">
            {depositNetworkAddress ?? "Prepare account to generate a deposit address."}
          </p>
          <p className="mt-2 text-xs leading-5 text-terminal-muted">
            This generated address credits the user-owned Polymarket account after the transfer settles.
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
                    : "Deposit"}
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-terminal-muted">
            Uses {DEFAULT_DEPOSIT_ASSET.symbol} on {DEFAULT_DEPOSIT_ASSET.chainName}. The wallet will ask the user to
            switch network and confirm the transfer.
          </p>
          {depositTxHash ? <CodeMetric label="Deposit transaction" value={depositTxHash} /> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSignOrder}
            disabled={!canSignOrder || orderSignState === "signing"}
            className="rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
          >
            {orderSignState === "signing" ? "Signing order..." : hasSignedOrder ? "Signed. Re-sign order" : "Sign user order"}
          </button>
          <button
            type="button"
            onClick={onSubmitOrder}
            disabled={!canSubmitOrder || submitState === "submitting"}
            className="rounded border border-terminal-red/60 bg-terminal-red/12 px-4 py-3 text-sm font-semibold text-terminal-red transition hover:bg-terminal-red/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
          >
            {submitState === "submitting" ? "Submitting..." : submitState === "submitted" ? "Submitted" : "Submit signed order"}
          </button>
        </div>
        {hasSignedOrder ? (
          <p className={canSubmitOrder ? "text-xs leading-5 text-terminal-green" : "text-xs leading-5 text-terminal-amber"}>
            {canSubmitOrder
              ? "Order is signed and ready to submit."
              : disabledReason ?? "Order is signed. Complete the remaining submit requirement."}
          </p>
        ) : null}
      </div>

      {walletMessage ? <p className="mt-4 text-xs leading-5 text-terminal-muted">{walletMessage}</p> : null}
      {session ? (
        <div className="mt-5 grid gap-3 rounded border border-terminal-line bg-terminal-panel2/75 p-4">
          <CodeMetric label="Connected wallet" value={session.walletAddress} />
          <CodeMetric label="Deposit wallet" value={session.funderAddress ?? "Pending"} />
          <CodeMetric label="Deposit status" value={session.depositWalletStatus ?? "unknown"} />
          <CodeMetric
            label="Account prep"
            value={`${accountPrepState} / auth ${credentialState} / approval ${approvalState} / deposit ${depositTxState}`}
          />
          <CodeMetric label="Session type" value={`signature type ${session.signatureType}`} />
        </div>
      ) : null}

      <ReadinessList checks={readiness?.checks ?? []} />

      {disabledReason && !hasSignedOrder ? <p className="mt-4 text-sm leading-6 text-terminal-red">{disabledReason}</p> : null}
      {hasSignedOrder ? (
        <label className="mt-5 block" htmlFor="real-order-confirmation">
          <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
            Type {USER_ORDER_CONFIRMATION}
          </span>
          <input
            id="real-order-confirmation"
            value={confirmationText}
            onChange={(event) => onConfirmationTextChange(event.target.value)}
            className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 font-mono text-xs text-terminal-text outline-none focus:border-terminal-red"
          />
        </label>
      ) : null}
    </div>
  );
}

function ReadinessList({ checks }: { checks: AccountReadinessCheck[] }) {
  if (checks.length === 0) {
    return (
      <div className="mt-5 rounded border border-terminal-line bg-terminal-panel2/75 p-4 text-sm leading-6 text-terminal-muted">
        Connect a wallet to inspect trading readiness.
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-2">
      {checks.map((check) => (
        <div key={check.id} className="rounded border border-terminal-line bg-terminal-panel2/75 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-terminal-text">{check.label}</p>
            <span className={getReadinessTone(check.status)}>{check.status.toUpperCase()}</span>
          </div>
          <p className="mt-2 break-all text-xs leading-5 text-terminal-muted">{check.detail}</p>
        </div>
      ))}
    </div>
  );
}

function UserOrderManagement({
  orders,
  state,
  message,
  cancelOrderId,
  cancelConfirmation,
  cancelState,
  onRefresh,
  onCancelOrderIdChange,
  onCancelConfirmationChange,
  onCancelOrder,
}: {
  orders: UserOpenOrder[];
  state: "idle" | "loading" | "ready" | "error";
  message?: string;
  cancelOrderId: string;
  cancelConfirmation: string;
  cancelState: "idle" | "submitting" | "submitted" | "error";
  onRefresh: () => void;
  onCancelOrderIdChange: (value: string) => void;
  onCancelConfirmationChange: (value: string) => void;
  onCancelOrder: () => void;
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader eyebrow="User orders" title="Open CLOB Orders" />
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
          <EmptyState title="Loading open orders" detail="Checking the connected user's active CLOB orders." />
        ) : orders.length > 0 ? (
          orders.slice(0, 6).map((order) => <UserOpenOrderCard key={order.id} order={order} />)
        ) : (
          <EmptyState
            title="No open orders loaded"
            detail="Prepare the account, then refresh to read open orders for the selected token."
          />
        )}
      </div>
      <div className="mt-6 rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-red">Cancel order</p>
        <div className="mt-4 grid gap-4">
          <label className="block" htmlFor="cancel-order-id">
            <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">Order id</span>
            <input
              id="cancel-order-id"
              value={cancelOrderId}
              onChange={(event) => onCancelOrderIdChange(event.target.value)}
              className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 font-mono text-xs text-terminal-text outline-none focus:border-terminal-red"
            />
          </label>
          <label className="block" htmlFor="cancel-order-confirmation">
            <span className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
              Type CANCEL USER ORDER
            </span>
            <input
              id="cancel-order-confirmation"
              value={cancelConfirmation}
              onChange={(event) => onCancelConfirmationChange(event.target.value)}
              className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 font-mono text-xs text-terminal-text outline-none focus:border-terminal-red"
            />
          </label>
          <button
            type="button"
            onClick={onCancelOrder}
            disabled={!cancelOrderId.trim() || cancelConfirmation !== "CANCEL USER ORDER" || cancelState === "submitting"}
            className="rounded border border-terminal-red/60 bg-terminal-red/12 px-4 py-3 text-sm font-semibold text-terminal-red transition hover:bg-terminal-red/20 disabled:cursor-not-allowed disabled:border-terminal-line disabled:bg-terminal-panel2 disabled:text-terminal-muted"
          >
            {cancelState === "submitting" ? "Submitting cancellation..." : "Cancel user order"}
          </button>
        </div>
        {message ? (
          <p className={state === "error" || cancelState === "error" ? "mt-4 text-xs leading-5 text-terminal-red" : "mt-4 text-xs leading-5 text-terminal-green"}>
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function UserOpenOrderCard({ order }: { order: UserOpenOrder }) {
  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
            {order.order_type} / {order.side} / {order.status}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-terminal-text">{order.outcome || order.asset_id}</h3>
        </div>
        <p className="text-sm font-semibold text-terminal-cyan">{Number(order.price).toFixed(3)}</p>
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

function getUserOrderDisabledReason(
  preview: BidOrderPreview | null,
  readiness: UserTradingReadiness | null,
  signedOrderPayload: unknown,
  confirmationText: string,
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
    return "Prepare the user account before signing an order.";
  }

  if (!readiness.ready) {
    const failedCheck = readiness.checks.find((check) => check.status !== "pass");
    return failedCheck ? `${failedCheck.label}: ${failedCheck.detail}` : "Trading readiness checks are incomplete.";
  }

  if (!signedOrderPayload) {
    return "Sign the user order with the connected wallet.";
  }

  if (confirmationText !== USER_ORDER_CONFIRMATION) {
    return `Type ${USER_ORDER_CONFIRMATION} to enable submit.`;
  }

  return undefined;
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
  },
) {
  handlers.onState("loading");
  handlers.onMessage(undefined);

  try {
    const url = tokenId ? `/api/trading/orders/open?tokenId=${encodeURIComponent(tokenId)}` : "/api/trading/orders/open";
    const response = await fetch(url);
    const payload = (await response.json()) as { orders?: UserOpenOrder[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to fetch open orders.");
    }

    handlers.onOrders(payload.orders ?? []);
    handlers.onState("ready");
  } catch (error) {
    handlers.onOrders([]);
    handlers.onState("error");
    handlers.onMessage(error instanceof Error ? error.message : String(error));
  }
}

function getReadinessTone(status: AccountReadinessCheck["status"]) {
  if (status === "pass") {
    return "rounded border border-terminal-green/45 px-2 py-1 text-[10px] font-semibold text-terminal-green";
  }

  if (status === "fail") {
    return "rounded border border-terminal-red/45 px-2 py-1 text-[10px] font-semibold text-terminal-red";
  }

  return "rounded border border-terminal-amber/45 px-2 py-1 text-[10px] font-semibold text-terminal-amber";
}

function formatUnixSeconds(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "n/a";
  }

  return new Date(value * 1000).toISOString();
}
