import Popover from "@/components/popover";
import { WalletAvatar } from "@/layout/header/wallet-avatar";
import {
  walletBalanceLabelClass,
  walletBalanceValueClass,
  walletConnectedBarClass,
  walletDepositButtonClass,
  walletMenuDividerClass,
  walletMenuTriggerClass
} from "@/layout/header/wallet-menu-ui";
import { useRef } from "react";

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
  const popoverRef = useRef<any>(null);

  return (
    <div className={walletConnectedBarClass}>
      <div className="cursor-pointer text-[#909090] text-base font-[457] px-2.5 rounded-lg bg-white border border-[#EBEBEB] h-[50px] flex flex-col items-end justify-center gap-0">
        <div className="flex items-center justify-center gap-1 leading-[17px]">
          <img
            src="/icons/icon-private.svg"
            alt=""
            className="shrink-0 w-4 h-3 object-center object-contain"
          />
          <div className="">
            Private Balance
          </div>
        </div>
        <div className="text-black text-base leading-[19px]">
          $0.00
        </div>
      </div>
      <div className="h-[31px] w-px shrink-0 bg-prophet-line"></div>
      <div className="flex flex-col justify-center items-end gap-0">
        <span className={walletBalanceLabelClass}>Balance</span>
        <span className={walletBalanceValueClass}>${balanceDisplay}</span>
      </div>

      <Popover
        ref={popoverRef}
        placement="BottomRight"
        trigger="Hover"
        content={(
          <div className="w-[120px] flex flex-col items-stretch gap-1 py-1 text-black text-sm font-[457] rounded-xl bg-white border border-[#EBEBEB] shadow-[0_0_10px_0_rgba(0,0,0,0.10)]">
            <button
              type="button"
              className="w-full text-left cursor-pointer hover:bg-[#999]/10 duration-150 px-3 py-2"
              onClick={() => {
                onDeposit();
                popoverRef.current?.onClose?.();
              }}
            >
              Deposit
            </button>
            <button
              type="button"
              className="w-full text-left cursor-pointer hover:bg-[#999]/10 duration-150 px-3 py-2"
              onClick={() => {
                onDeposit();
                popoverRef.current?.onClose?.();
              }}
            >
              Private Topup
            </button>
          </div>
        )}
      >
        <button
          type="button"
          className={walletDepositButtonClass}
        >
          Deposit
        </button>
      </Popover>

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
