"use client";

import { useCallback, useState } from "react";

import { fetchJson } from "@/lib/team/client-fetch";
import {
  formatMarketCancelToastSummary,
  formatOrderCancelToastSummary,
  showMarketOrdersCancelledToast,
  showOrderCancelledToast,
  showOrderErrorToast,
  showPartialMarketCancelToast
} from "@/lib/trading/order-toast";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { useAuth } from "@/context/auth/use-auth";
import { usePortfolioContext } from "@/views/portfolio/context";

type CancelMarketOrdersResponse = {
  canceled?: string[];
  not_canceled?: Record<string, string>;
  error?: string;
};

export function useCancelOpenOrder(options?: {
  onOrderCancelled?: (orderId: string) => void;
  onOrdersCancelled?: (orderIds: string[]) => void;
}) {
  const { isRegionBlocked } = useAuth();
  const { removeOpenOrder, removeOpenOrders } = usePortfolioContext();
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelingMarketId, setCancelingMarketId] = useState<string | null>(
    null
  );

  const onOrderCancelled = options?.onOrderCancelled ?? removeOpenOrder;
  const onOrdersCancelled = options?.onOrdersCancelled ?? removeOpenOrders;

  const cancelOpenOrder = useCallback(
    async (order: UserOpenOrder) => {
      if (cancelingOrderId !== null || cancelingMarketId !== null || isRegionBlocked) {
        return;
      }

      setCancelingOrderId(order.id);

      try {
        await fetchJson("/api/trading/orders/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id })
        });

        showOrderCancelledToast(formatOrderCancelToastSummary(order));
        onOrderCancelled(order.id);
      } catch (error) {
        showOrderErrorToast(error);
      } finally {
        setCancelingOrderId(null);
      }
    },
    [
      cancelingMarketId,
      cancelingOrderId,
      isRegionBlocked,
      onOrderCancelled
    ]
  );

  const cancelMarketOrders = useCallback(
    async ({
      marketId,
      marketTitle,
      orders
    }: {
      marketId: string;
      marketTitle: string;
      orders: UserOpenOrder[];
    }) => {
      if (
        cancelingOrderId !== null ||
        cancelingMarketId !== null ||
        isRegionBlocked ||
        orders.length === 0
      ) {
        return;
      }

      setCancelingMarketId(marketId);

      try {
        const result = await fetchJson<CancelMarketOrdersResponse>(
          "/api/trading/orders/cancel-market",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ market: marketId })
          }
        );

        const canceled = result.canceled ?? [];
        const notCanceled = result.not_canceled ?? {};
        const failedCount = Object.keys(notCanceled).length;

        if (canceled.length > 0) {
          onOrdersCancelled(canceled);
        }

        if (failedCount === 0 && canceled.length > 0) {
          showMarketOrdersCancelledToast(
            formatMarketCancelToastSummary(marketTitle, canceled.length)
          );
        } else if (canceled.length > 0 && failedCount > 0) {
          showPartialMarketCancelToast(canceled.length, failedCount);
        } else if (failedCount > 0) {
          showOrderErrorToast(
            Object.values(notCanceled).join(" ") || "Unable to cancel orders."
          );
        }
      } catch (error) {
        showOrderErrorToast(error);
      } finally {
        setCancelingMarketId(null);
      }
    },
    [
      cancelingMarketId,
      cancelingOrderId,
      isRegionBlocked,
      onOrdersCancelled
    ]
  );

  const isCanceling = useCallback(
    (orderId: string) => cancelingOrderId === orderId,
    [cancelingOrderId]
  );

  const isCancelingMarket = useCallback(
    (marketId: string) => cancelingMarketId === marketId,
    [cancelingMarketId]
  );

  return {
    cancelOpenOrder,
    cancelMarketOrders,
    isCanceling,
    isCancelingMarket,
    cancelingOrderId,
    cancelingMarketId
  };
}
