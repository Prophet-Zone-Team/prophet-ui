import { WalletAvatar } from "@/layout/header/wallet-avatar";
import {
  walletBalanceLabelClass,
  walletBalanceValueClass,
  walletConnectedBarClass,
  walletDepositButtonClass,
  walletMenuDividerClass,
  walletMenuTriggerClass
} from "@/layout/header/wallet-menu-ui";

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
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      aria-hidden
      className={open ? "rotate-180" : undefined}
    >
      <path
        d="M2 4L5.5 7.5L9 4"
        stroke="black"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
