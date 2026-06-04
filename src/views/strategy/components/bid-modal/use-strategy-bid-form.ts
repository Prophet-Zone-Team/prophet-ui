"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuthOptional } from "@/context/auth";
import {
  formatStrategyBidAmountInput,
  formatStrategyBudgetLabel
} from "@/lib/strategy/strategy-metrics";
import { isStrategyBidSkipPreValidationEnabled } from "@/lib/strategy/strategy-bid-test-mode";
import {
  INSUFFICIENT_FUNDS_MESSAGE,
  validateStrategyBid
} from "@/lib/strategy/strategy-bid-validation";
import { formatNumber } from "@/utils/format";
import type { AvailableStrategyCardData } from "@/views/strategy/lib/map-strategy-data";
import type { TeamMarketSnapshot } from "@/types/market";

import type { StrategyBidPreview } from "./types";

function parseBidAmountInput(value: string): number {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export function useStrategyBidForm(
  open: boolean,
  strategy: AvailableStrategyCardData | null,
  snapshots: TeamMarketSnapshot[]
) {
  const auth = useAuthOptional();
  const [bidAmountInput, setBidAmountInput] = useState("0");
  const [riskAccepted, setRiskAccepted] = useState(false);

  const balance = auth?.cash?.available ?? 0;
  const balanceLabel = formatNumber(balance, 2, true, {
    round: 0,
    isZeroPrecision: true
  });

  useEffect(() => {
    if (!open || !strategy) {
      return;
    }

    setBidAmountInput(formatStrategyBidAmountInput(strategy.budget));
    setRiskAccepted(false);
  }, [open, strategy?.id, strategy?.budget]);

  const bidAmount = parseBidAmountInput(bidAmountInput);
  const skipPreValidation = isStrategyBidSkipPreValidationEnabled();

  const validation = useMemo(() => {
    if (!strategy) {
      return null;
    }

    return validateStrategyBid({
      strategy,
      snapshots,
      bidAmount,
      availableCash: balance,
      riskAccepted,
      skipPreValidation
    });
  }, [balance, bidAmount, riskAccepted, skipPreValidation, snapshots, strategy]);

  const preview = useMemo<StrategyBidPreview | null>(() => {
    if (!validation) {
      return null;
    }

    return {
      ...validation,
      marketRows: validation.legs.map((leg) => ({
        id: leg.id,
        team: leg.team,
        teamName: leg.teamName,
        tradedLabel: leg.valuedLabel,
        invalid: !leg.validation.valid,
        invalidReason: leg.validation.reason
      }))
    };
  }, [validation]);

  function applyBalanceFraction(fraction: number) {
    if (balance <= 0) {
      return;
    }

    setBidAmountInput(formatStrategyBidAmountInput(balance * fraction));
  }

  function handleBidAmountChange(value: string) {
    setBidAmountInput(value);
  }

  const canProceedToSign = validation?.canProceedToSign ?? false;
  const insufficientFunds = validation?.insufficientFunds ?? false;
  const aggregateError =
    !skipPreValidation && insufficientFunds ? INSUFFICIENT_FUNDS_MESSAGE : undefined;
  const totalBidLabel = formatStrategyBudgetLabel(bidAmount);

  return {
    bidAmount,
    bidAmountInput,
    balance,
    balanceLabel,
    preview,
    validation,
    riskAccepted,
    canProceedToSign,
    insufficientFunds: insufficientFunds && !skipPreValidation,
    skipPreValidation,
    aggregateError,
    totalBidLabel,
    setRiskAccepted,
    handleBidAmountChange,
    applyBalanceFraction
  };
}
