import type { createTranslator } from "next-intl";

import { formatDateTimeFromIso } from "@/lib/formatters/datetime";
import type { AppMessages } from "@/lib/i18n/runtime-messages";
import type { LimitExpirationPreset } from "@/store/trade-ticket-store";
import type {
  BidTradeSide,
  FixtureMarketOutcome,
  MatchOutcomeSide,
  OrderOutcomeSide
} from "@/types/market";
import type { TradePrimaryActionKind } from "@/lib/trading/trade-primary-action";

type TradeTranslator = ReturnType<
  typeof createTranslator<AppMessages, "trade">
>;
type TradeMessageKey = keyof AppMessages["trade"] & string;

const TRADE_GATE_MESSAGE_KEYS: Partial<Record<string, TradeMessageKey>> = {
  "Connect your wallet to continue.": "connectWalletToContinue",
  "Deploy your Polymarket deposit wallet to continue.":
    "deployWalletToContinue",
  "Sign once to derive your user-specific Polymarket CLOB credentials.":
    "signClobCredentials",
  "Authorize token spending before placing orders.":
    "authorizeTokenSpending",
  "This market is not available for real orders.": "marketNotAvailable",
  "Order readiness is unavailable. Refresh and try again.":
    "orderReadinessUnavailable",
  "Complete CLOB credential setup before submitting.": "completeClobSetup",
  "Complete token authorization before submitting.":
    "completeTokenAuthorization",
  "Trading account is not ready for this order.":
    "tradingAccountNotReady",
  "Polymarket geoblock check timed out or is unreachable. Retry the eligibility check.":
    "eligibilityRetryMessage",
  "Polymarket geoblock check timed out or is unreachable.":
    "eligibilityRetryMessage",
  "Insufficient funds": "insufficientFunds",
  "Insufficient USDC balance for this order. Deposit funds to continue.":
    "insufficientUsdcBalance",
  "Market data unavailable.": "marketDataUnavailable",
  "No Polymarket token ID is available for this outcome.":
    "noTokenIdForOutcome",
  "This Polymarket market is not accepting orders.":
    "marketNotAcceptingOrders",
  "This Polymarket market is closed.": "marketClosed",
  "Enter a positive amount.": "enterPositiveAmount",
  "Enter a take profit limit price.": "enterTakeProfitLimitPrice",
  "Refresh your trading allowance, then submit your order again.":
    "refreshAllowanceHint",
  "Balance and allowance checks require user CLOB credentials.":
    "fundingChecksRequireCredentials",
  "USDC balance could not be read.": "fundingBalanceCouldNotBeRead",
  "Balance requires user CLOB credentials.":
    "fundingBalanceRequiresCredentials"
};

const FUNDING_LABEL_KEYS: Partial<Record<string, TradeMessageKey>> = {
  "USDC balance": "fundingLabelUsdcBalance",
  "USDC allowance": "fundingLabelUsdcAllowance",
  "Token balance": "fundingLabelTokenBalance",
  "Token allowance": "fundingLabelTokenAllowance",
  "Conditional token balance": "fundingLabelConditionalTokenBalance",
  "Conditional token allowance": "fundingLabelConditionalTokenAllowance"
};

function translateFundingLabel(label: string, t: TradeTranslator): string {
  const key = FUNDING_LABEL_KEYS[label];

  return key ? t(key) : label;
}

function translateFundingUnit(unit: string, t: TradeTranslator): string {
  if (unit === "USDC") {
    return "USDC";
  }

  if (unit === "shares") {
    return t("fundingUnitShares");
  }

  return unit;
}

function translateFundingSuffix(suffix: string, t: TradeTranslator): string {
  if (suffix === "On-chain and CLOB cache are being reconciled.") {
    return t("fundingReconcilingOnchain");
  }

  const onchainMatch = suffix.match(
    /^On-chain deposit wallet shows ([\d,.\s]+) USDC; CLOB cache shows ([\d,.\s]+) USDC\.$/
  );

  if (onchainMatch) {
    return t("fundingOnchainClobMismatch", {
      onchain: onchainMatch[1],
      clob: onchainMatch[2]
    });
  }

  return suffix;
}

function translateFundingDetailMessage(
  message: string,
  t: TradeTranslator
): string | undefined {
  const availableMatch = message.match(
    /^(.+?): ([\d,.\s]+) (\w+) available; ([\d,.\s]+) (\w+) required\.(?: (.+))?$/
  );

  if (availableMatch) {
    const [, label, available, unit1, required, unit2, suffixPart] =
      availableMatch;

    if (unit1 !== unit2) {
      return undefined;
    }

    const translated = t("fundingDetailAvailable", {
      label: translateFundingLabel(label, t),
      available,
      required,
      unit: translateFundingUnit(unit1, t)
    });

    if (!suffixPart) {
      return translated;
    }

    const suffix = translateFundingSuffix(suffixPart.trim(), t);

    return suffix ? `${translated} ${suffix}` : translated;
  }

  const unavailableMatch = message.match(
    /^(.+?) is not available\. Required: ([\d,.\s]+) (\w+)\.$/
  );

  if (unavailableMatch) {
    const [, label, required, unit] = unavailableMatch;

    return t("fundingDetailUnavailable", {
      label: translateFundingLabel(label, t),
      required,
      unit: translateFundingUnit(unit, t)
    });
  }

  const balanceAvailableMatch = message.match(/^([\d.]+) USDC available\.$/);

  if (balanceAvailableMatch) {
    return t("fundingBalanceAvailable", {
      amount: balanceAvailableMatch[1]
    });
  }

  const checkFailureMatch = message.match(/^(.+?): (.+)$/);

  if (checkFailureMatch) {
    const [, label, detail] = checkFailureMatch;
    const labelKey = FUNDING_LABEL_KEYS[label];

    if (labelKey) {
      const translatedDetail =
        translateFundingDetailMessage(detail, t) ??
        translateTradeMessage(detail, t);

      return t("fundingCheckFailure", {
        label: t(labelKey),
        detail: translatedDetail
      });
    }
  }

  return undefined;
}

export const LIMIT_EXPIRATION_PRESETS: LimitExpirationPreset[] = [
  "never",
  "5m",
  "1h",
  "12h",
  "24h",
  "end_of_day",
  "custom"
];

export const LIMIT_EXPIRATION_OPTION_KEYS: Record<
  LimitExpirationPreset,
  TradeMessageKey
> = {
  never: "expirationNever",
  "5m": "expiration5Min",
  "1h": "expiration1Hour",
  "12h": "expiration12Hours",
  "24h": "expiration24Hours",
  end_of_day: "expirationEndOfDay",
  custom: "expirationCustom"
};

export function translateTradeMessage(
  message: string,
  t: TradeTranslator
): string {
  const key = TRADE_GATE_MESSAGE_KEYS[message];

  if (key) {
    return t(key);
  }

  const minAmountMatch = message.match(/^Amount must be at least \$(.+)\.$/);

  if (minAmountMatch) {
    return t("amountMinOrderSize", { amount: minAmountMatch[1] });
  }

  const limitBuyMatch = message.match(
    /^Limit buy orders must be at least (\d+) shares\.$/
  );

  if (limitBuyMatch) {
    return t("limitBuyMinShares", { minShares: limitBuyMatch[1] });
  }

  const marketBuyMatch = message.match(
    /^Market buy orders must be at least (\d+) shares(\. Increase the amount and try again\.)?$/
  );

  if (marketBuyMatch) {
    return t("marketBuyMinShares", { minShares: marketBuyMatch[1] });
  }

  if (message.includes("\n")) {
    return message
      .split("\n")
      .map((line) => translateTradeMessage(line, t))
      .join("\n");
  }

  const fundingTranslation = translateFundingDetailMessage(message, t);

  return fundingTranslation ?? message;
}

export function resolveTradeActionLabel(
  t: TradeTranslator,
  tradeSide: BidTradeSide,
  outcomeSide: OrderOutcomeSide,
  variant: "team" | "game"
): string {
  if (tradeSide === "sell") {
    return outcomeSide === "yes" ? t("sellYes") : t("sellNo");
  }

  if (variant === "team") {
    return outcomeSide === "yes" ? t("bidForYes") : t("bidForNo");
  }

  return outcomeSide === "yes" ? t("buyYes") : t("buyNo");
}

export function resolveTradePrimaryActionLabel(
  t: TradeTranslator,
  kind: TradePrimaryActionKind,
  submitLabel: string
): string {
  switch (kind) {
    case "connect":
    case "sign_clob":
      return t("enableTrading");
    case "deploy_wallet":
      return t("prepareAccount");
    case "authorize_tokens":
      return t("authorizeTokens");
    case "deposit":
      return t("addFunds");
    case "sync_allowance":
      return t("refreshAllowance");
    case "retry_eligibility":
      return t("retryEligibility");
    default:
      return submitLabel;
  }
}

export function getLimitExpirationLabel(
  t: TradeTranslator,
  preset: LimitExpirationPreset,
  customDate?: string,
  _locale = "en"
): string {
  if (preset === "custom" && customDate) {
    return formatDateTimeFromIso(customDate);
  }

  return t(LIMIT_EXPIRATION_OPTION_KEYS[preset] ?? "expirationNever");
}

export function validateLimitExpirationCustom(
  t: TradeTranslator,
  customDate: string | undefined,
  now = new Date()
): string | undefined {
  if (!customDate) {
    return t("expirationCustomRequired");
  }

  const expirationDate = new Date(customDate);

  if (Number.isNaN(expirationDate.getTime())) {
    return t("expirationCustomInvalid");
  }

  if (expirationDate.getTime() <= now.getTime()) {
    return t("expirationCustomFuture");
  }

  return undefined;
}

export function resolveGameOutcomeLabel(
  t: TradeTranslator,
  matchOutcomeSide: MatchOutcomeSide,
  homeName: string,
  awayName: string
): string {
  if (matchOutcomeSide === "draw") {
    return t("draw");
  }

  if (matchOutcomeSide === "away") {
    return awayName;
  }

  return homeName;
}

function formatTotalOutcomeAbbrevLabel(
  t: TradeTranslator,
  outcome: FixtureMarketOutcome
): string | undefined {
  if (outcome.marketType !== "total") {
    return undefined;
  }

  if (outcome.side === "over" && outcome.line !== undefined) {
    return `${t("overAbbrev")}${outcome.line}`;
  }

  if (outcome.side === "under" && outcome.line !== undefined) {
    return `${t("underAbbrev")}${outcome.line}`;
  }

  const abbrevMatch = outcome.label.match(/^(O|U)(\d+(?:\.\d+)?)$/);

  if (!abbrevMatch) {
    return undefined;
  }

  const abbrev =
    abbrevMatch[1] === "O" ? t("overAbbrev") : t("underAbbrev");

  return `${abbrev}${abbrevMatch[2]}`;
}

export function resolveFixtureOutcomeLabel(
  t: TradeTranslator,
  outcome: FixtureMarketOutcome
): string {
  if (outcome.marketType === "halftime") {
    return t("halftimePrefix", { label: outcome.label });
  }

  if (outcome.marketType === "btts") {
    return t("bothTeamsToScore");
  }

  return formatTotalOutcomeAbbrevLabel(t, outcome) ?? outcome.label;
}

function isSingleOutcomeBinaryMarket(
  marketType: FixtureMarketOutcome["marketType"],
): boolean {
  return (
    marketType === "extra_time" ||
    marketType === "penalty_shootout" ||
    marketType === "btts"
  );
}

export function resolveTradeWidgetOutcomeLabel(
  t: TradeTranslator,
  outcome: FixtureMarketOutcome | null,
  binarySide: OrderOutcomeSide,
  matchOutcomeSide: MatchOutcomeSide,
  homeName: string,
  awayName: string,
): string {
  if (!outcome) {
    return resolveGameOutcomeLabel(t, matchOutcomeSide, homeName, awayName);
  }

  if (isSingleOutcomeBinaryMarket(outcome.marketType)) {
    return binarySide === "yes" ? t("yes") : t("no");
  }

  return resolveFixtureOutcomeLabel(t, outcome);
}

export function resolveTradeWidgetHeaderTitle(
  t: TradeTranslator,
  outcome: FixtureMarketOutcome | null,
  homeName: string,
  awayName: string
): string {
  if (!outcome) {
    return t("matchVersus", { home: homeName, away: awayName });
  }

  switch (outcome.marketType) {
    case "spread":
      return t("spreads");
    case "total":
      return t("totals");
    case "btts":
      return t("bttsQuestion");
    case "team_to_advance":
      return t("teamToAdvance");
    case "extra_time":
      return t("extraTimeQuestion");
    case "penalty_shootout":
      return t("penaltyShootoutQuestion");
    case "exact_score":
      return t("exactScore");
    case "halftime":
      return t("halftimeResult");
    case "moneyline":
    default:
      return t("matchVersus", { home: homeName, away: awayName });
  }
}
