"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import type { StrategyBidLeg } from "@/lib/strategy/strategy-bid-validation";
import {
  reportStrategyBidSubmission,
  resolveStrategyBidSignError,
  signStrategyBidLeg,
  submitStrategyBidBatch,
  summarizeStrategyBidSubmission
} from "@/lib/strategy/run-strategy-bid";
import { ensureTradingReadyForBid } from "@/views/trade/trade-widget/trade-ticket-helpers";

import type { LegSignStatus, StrategyBidSignLegState } from "../types";

function createInitialLegStates(
  legs: StrategyBidLeg[]
): StrategyBidSignLegState[] {
  return legs.map((leg) => ({
    leg,
    status: "pending" as LegSignStatus
  }));
}

export function useStrategyBidSign(input: {
  open: boolean;
  legs: StrategyBidLeg[];
  strategyName: string;
  bidAmount: number;
  estimatedRoiLabel: string;
  hitReturnLabel: string;
  onComplete: () => void;
}) {
  const auth = useAuth();
  const [legStates, setLegStates] = useState<StrategyBidSignLegState[]>(() =>
    createInitialLegStates(input.legs)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const signingRef = useRef(false);

  useEffect(() => {
    if (!input.open) {
      setLegStates(createInitialLegStates(input.legs));
      setIsSubmitting(false);
      setSubmitError(undefined);
      signingRef.current = false;
    }
  }, [input.legs, input.open]);

  const allSigned = useMemo(
    () =>
      legStates.length > 0 &&
      legStates.every((entry) => entry.status === "signed" && entry.signed),
    [legStates]
  );

  const canSubmitOrders = allSigned && !isSubmitting;

  const signLegAtIndex = useCallback(
    async (index: number) => {
      if (signingRef.current) {
        return;
      }

      const current = legStates[index];

      if (
        !current ||
        current.status === "signing" ||
        current.status === "signed"
      ) {
        return;
      }

      signingRef.current = true;
      setLegStates((previous) =>
        previous.map((entry, entryIndex) =>
          entryIndex === index
            ? { ...entry, status: "signing", errorMessage: undefined }
            : entry
        )
      );

      try {
        const session = auth.session;

        if (!session?.funderAddress) {
          throw new Error(
            "A connected wallet, deployed deposit wallet, and Polymarket token are required."
          );
        }

        const signed = await signStrategyBidLeg(current.leg, session);

        setLegStates((previous) =>
          previous.map((entry, entryIndex) =>
            entryIndex === index
              ? {
                  ...entry,
                  status: "signed",
                  signed,
                  hasSignedOnce: true,
                  errorMessage: undefined
                }
              : entry
          )
        );
      } catch (error) {
        const errorMessage = resolveStrategyBidSignError(error);

        setLegStates((previous) =>
          previous.map((entry, entryIndex) =>
            entryIndex === index
              ? entry.hasSignedOnce
                ? {
                    ...entry,
                    status: "sign_failed",
                    errorMessage
                  }
                : {
                    ...entry,
                    status: "pending",
                    errorMessage
                  }
              : entry
          )
        );
      } finally {
        signingRef.current = false;
      }
    },
    [auth.session, legStates]
  );

  useEffect(() => {
    if (!input.open || signingRef.current || isSubmitting) {
      return;
    }

    const pendingIndex = legStates.findIndex(
      (entry) => entry.status === "pending" && !entry.errorMessage
    );
    const isSigning = legStates.some((entry) => entry.status === "signing");

    if (pendingIndex >= 0 && !isSigning) {
      void signLegAtIndex(pendingIndex);
    }
  }, [input.open, isSubmitting, legStates, signLegAtIndex]);

  const signLeg = useCallback(
    async (legId: string) => {
      const index = legStates.findIndex((entry) => entry.leg.id === legId);

      if (index >= 0) {
        await signLegAtIndex(index);
      }
    },
    [legStates, signLegAtIndex]
  );

  const signAgain = useCallback(async (legId: string) => {
    setLegStates((previous) =>
      previous.map((entry) =>
        entry.leg.id === legId
          ? {
              ...entry,
              status: "pending",
              errorMessage: undefined,
              signed: undefined
            }
          : entry
      )
    );
  }, []);

  const submitOrders = useCallback(async () => {
    const signedLegs = legStates
      .map((entry) => entry.signed)
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (signedLegs.length !== legStates.length) {
      setSubmitError("All legs must be signed before submitting orders.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const gate = await ensureTradingReadyForBid({
        session: auth.session,
        authReadiness: auth.readiness,
        orderReadiness: auth.readiness,
        previewCanSubmit: true,
        isRegionBlocked: auth.isRegionBlocked,
        openLogin: auth.openLogin,
        signClobCredentials: auth.signClobCredentials,
        signTokenApprovals: auth.signTokenApprovals,
        refreshSetupReadiness: auth.refreshSetupReadiness
      });

      if (!gate.ok) {
        throw new Error(gate.message);
      }

      const result = await submitStrategyBidBatch(signedLegs);

      setLegStates((previous) =>
        previous.map((entry, index) => {
          const batchResult = result.results[index];

          if (!batchResult || batchResult.success) {
            return entry;
          }

          return {
            ...entry,
            status: "submit_failed",
            errorMessage: batchResult.error ?? "Transaction Failed"
          };
        })
      );

      summarizeStrategyBidSubmission(result, input.strategyName);

      if (result.failureCount === 0) {
        await reportStrategyBidSubmission({
          strategyName: input.strategyName,
          bidAmount: input.bidAmount,
          estimatedRoiLabel: input.estimatedRoiLabel,
          hitReturnLabel: input.hitReturnLabel,
          signedLegs,
          batchResult: result
        });
        await auth.refreshCash();
        input.onComplete();
      }
    } catch (error) {
      setSubmitError(resolveStrategyBidSignError(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [auth, input, legStates]);

  return {
    legStates,
    isSubmitting,
    submitError,
    canSubmitOrders,
    signLeg,
    signAgain,
    submitOrders
  };
}
