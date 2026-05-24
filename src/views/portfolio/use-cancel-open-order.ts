"use client";

import { useCallback, useState } from "react";

import { fetchJson } from "@/lib/team/client-fetch";
import {
  formatOrderCancelToastSummary,
  showOrderCancelledToast,
  showOrderErrorToast
} from "@/lib/trading/order-toast";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { usePortfolioContext } from "@/views/portfolio/context";

export function useCancelOpenOrder(options?: {
  onOrderCancelled?: (orderId: string) => void;
}) {
  const { removeOpenOrder } = usePortfolioContext();
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

  const onOrderCancelled = options?.onOrderCancelled ?? removeOpenOrder;

  const cancelOpenOrder = useCallback(
    async (order: UserOpenOrder) => {
      if (cancelingOrderId !== null) {
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
    [cancelingOrderId, onOrderCancelled]
  );

  const isCanceling = useCallback(
    (orderId: string) => cancelingOrderId === orderId,
    [cancelingOrderId]
  );

  return { cancelOpenOrder, isCanceling, cancelingOrderId };
}
