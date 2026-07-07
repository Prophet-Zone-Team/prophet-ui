"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";

export interface TronWalletOption {
  name: string;
  icon?: string;
  readyState?: string;
  adapter: {
    name: string;
    connect: () => Promise<void>;
  };
}

export interface TronWalletSelectorModalProps {
  open: boolean;
  connecting: boolean;
  wallets: TronWalletOption[];
  onClose: () => void;
  onSelect: (wallet: TronWalletOption) => void;
}

export function TronWalletSelectorModal({
  open,
  connecting,
  wallets,
  onClose,
  onSelect,
}: TronWalletSelectorModalProps) {
  const t = useTranslations("wallet");

  const sortedWallets = wallets.sort((a, b) => {
    if (a.readyState === "Found") return -1;
    if (b.readyState === "Found") return 1;
    return 0;
  });

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("selectTronWallet")}
      className="max-w-[400px]"
    >
      <div className="w-[350px] rounded-[16px] border border-prophet-line flex flex-col gap-2 p-4 bg-prophet-panel">
        <h2 className="m-0 text-lg font-[500] text-prophet-foreground">{t("selectTronWallet")}</h2>
        {sortedWallets.length === 0 ? (
          <p className="m-0 text-sm text-[#909090]">{t("noTronWalletDetected")}</p>
        ) : (
          sortedWallets.map((wallet) => (
            <button
              key={wallet.name}
              type="button"
              disabled={connecting}
              className="flex justify-between items-center gap-3 rounded-lg border border-prophet-line px-4 py-3 text-left transition-colors hover:bg-prophet-hover"
              onClick={() => onSelect(wallet)}
            >
              <div className="flex items-center gap-3">
                {wallet.icon ? (
                  <Image
                    src={wallet.icon}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-[4px]"
                  />
                ) : (
                  <span className="size-8 rounded-[4px] bg-[#f4f4f4]" />
                )}
                <span className="text-base font-[500] text-prophet-foreground">{wallet.name}</span>
              </div>
              {
                wallet.readyState === "Found" && (
                  <div className="uppercase text-[12px] p-[2px_6px] text-[#26d962] bg-[rgba(38,217,98,0.20)] rounded-[4px]">
                    Detected
                  </div>
                )
              }
            </button>
          ))
        )}
      </div>
    </FundingResponsiveOverlay>
  );
}
