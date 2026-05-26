import { WalletAvatar } from "@/layout/header/wallet-avatar";
import {
  walletBalanceLabelClass,
  walletBalanceValueClass,
  walletConnectedBarClass,
  walletDepositButtonClass,
  walletMenuDividerClass,
  walletMenuTriggerClass
} from "@/layout/header/wallet-menu-ui";
import { cn } from "@/lib/cn";

export interface WalletConnectedBarProps {
  polymarketAddress: string;
  balanceDisplay: string;
  isMenuOpen: boolean;
  onDeposit: () => void;
  onToggleMenu: () => void;
}

export function WalletConnectedBar({
  polymarketAddress,
  balanceDisplay,
  isMenuOpen,
  onDeposit,
  onToggleMenu
}: WalletConnectedBarProps) {
  return (
    <div className={walletConnectedBarClass}>
      <div className="flex items-baseline gap-1.5">
        <span className={walletBalanceLabelClass}>Bal.</span>
        <span className={walletBalanceValueClass}>${balanceDisplay}</span>
      </div>

      <button
        type="button"
        className={walletDepositButtonClass}
        onClick={onDeposit}
      >
        Deposit
      </button>

      <span className={walletMenuDividerClass} aria-hidden="true" />

      <button
        type="button"
        className={walletMenuTriggerClass}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={onToggleMenu}
      >
        <WalletAvatar address={polymarketAddress} />
        <ChevronIcon open={isMenuOpen} />
      </button>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="6"
      viewBox="0 0 12 6"
      fill="none"
      className={cn("transition-transform", open ? "rotate-180" : undefined)}
    >
      <path
        d="M0.5 0.5L5.86828 4.5L11.5 0.5"
        stroke="black"
        strokeLinecap="round"
      />
    </svg>
  );
}
