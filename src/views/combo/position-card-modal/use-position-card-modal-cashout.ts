"use client";

import { useAuth } from "@/context/auth";
import { useComboCashout } from "@/hooks/combo/use-combo-cashout";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { usePortfolioContext } from "@/views/portfolio/context";

import type { PositionCardModalProps } from "./types";

export type PositionCardModalWithCashoutProps = PositionCardModalProps;

export function usePositionCardModalCashout(
  combo: PositionCardModalProps["combo"],
  open: boolean,
  onClose: () => void,
) {
  const { removeComboPosition } = usePortfolioContext();
  const auth = useAuth();

  const cashout = useComboCashout({
    combo,
    open,
    onSuccess: () => {
      if (combo?.id) {
        removeComboPosition(combo.id);
      }
      onClose();
    },
  });

  return {
    auth,
    cashout,
    formatCashoutLabel: (amount: number | undefined) =>
      amount != null && amount > 0
        ? `Cashout ${formatTeamDetailMoney(amount)}`
        : "Cashout",
  };
}
