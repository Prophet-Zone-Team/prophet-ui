import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
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
import { useMemo, useRef } from "react";

export interface WalletConnectedBarProps {
  polymarketAddress: string;
  balanceDisplay: string;
  isMenuOpen: boolean;
  regionRestricted?: boolean;
  isPrivateMode?: boolean;
  onDeposit: () => void;
  onPrivateTopup: () => void;
  onPrivateBalanceClick: () => void;
  onToggleMenu: () => void;
}

export function WalletConnectedBar({
  polymarketAddress,
  balanceDisplay,
  isMenuOpen,
  regionRestricted = false,
  onDeposit,
  onPrivateTopup,
  onPrivateBalanceClick,
  onToggleMenu,
  isPrivateMode,
}: WalletConnectedBarProps) {
  const popoverRef = useRef<any>(null);

  const privateBalanceButton = (
    <button
      type="button"
      className="cursor-pointer text-[#909090] text-sm font-[457] px-2.5 rounded-lg border border-[#EBEBEB] h-[50px] flex flex-col items-end justify-center gap-0 transition-colors hover:border-[#d0d0d0]"
      onClick={onPrivateBalanceClick}
      aria-label="Open Private Topup"
    >
      <div className="flex items-center justify-center gap-1 leading-[17px]">
        <img
          src="/icons/icon-private.svg"
          alt=""
          className="shrink-0 w-4 h-3 object-center object-contain"
        />
        <div className="">Private Balance</div>
      </div>
      <div className="text-black text-base leading-[19px]">$0.00</div>
    </button>
  );

  const depositButton = (
    <button
      type="button"
      className={walletDepositButtonClass}
      onClick={() => {
        onDeposit();
        popoverRef.current?.onClose?.();
      }}
    >
      Deposit
    </button>
  );

  return (
    <div className={walletConnectedBarClass}>
      {
        !isPrivateMode && (
          <>
            <RegionRestrictedControl restricted={regionRestricted}>
              {privateBalanceButton}
            </RegionRestrictedControl>
            <div className="h-[31px] w-px shrink-0 bg-prophet-line"></div>
            <div className="flex flex-col justify-center items-end gap-0">
              <span className={walletBalanceLabelClass}>Balance</span>
              <span className={walletBalanceValueClass}>${balanceDisplay}</span>
            </div>

            {regionRestricted ? (
              <RegionRestrictedControl restricted>{depositButton}</RegionRestrictedControl>
            ) : (
              // <Popover
              //   ref={popoverRef}
              //   placement="BottomRight"
              //   trigger="Hover"
              //   content={
              //     <div className="w-[130px] flex flex-col items-stretch gap-1 py-1 text-black text-sm rounded-xl bg-white border border-[#EBEBEB] shadow-[0_0_10px_0_rgba(0,0,0,0.10)]">
              //       <button
              //         type="button"
              //         className="w-full text-left cursor-pointer hover:bg-[#999]/10 duration-150 px-3 py-2"
              //         onClick={() => {
              //           onDeposit();
              //           popoverRef.current?.onClose?.();
              //         }}
              //       >
              //         Deposit
              //       </button>
              //       <button
              //         type="button"
              //         className="w-full text-left cursor-pointer hover:bg-[#999]/10 duration-150 px-3 py-2"
              //         onClick={() => {
              //           onPrivateTopup();
              //           popoverRef.current?.onClose?.();
              //         }}
              //       >
              //         Private Topup
              //       </button>
              //     </div>
              //   }
              // >
              depositButton
              // </Popover>
            )}

            <span className={walletMenuDividerClass} aria-hidden="true" />
          </>
        )
      }

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
