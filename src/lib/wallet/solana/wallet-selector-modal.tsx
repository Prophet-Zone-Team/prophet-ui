"use client";

import type { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { useSolanaWalletModal } from "@/lib/wallet/solana/wallet-modal-context";

export function SolanaWalletSelectorModal() {
  const t = useTranslations("wallet");
  const { visible, setVisible } = useSolanaWalletModal();
  const { wallets, select, connecting } = useWallet();

  const sortedWallets = wallets.sort((a, b) => {
    if (a.readyState === "Installed") return -1;
    if (b.readyState === "Installed") return 1;
    return 0;
  });

  const handleSelect = async (wallet: any) => {
    const walletName = wallet.adapter.name as WalletName;
    select(walletName);
    await wallet.adapter.connect();
    setVisible(false);
  };

  return (
    <FundingResponsiveOverlay
      open={visible}
      onClose={() => setVisible(false)}
      ariaLabel={t("selectSolanaWallet")}
      className="max-w-[400px]"
    >
      <div className="w-[350px] rounded-[16px] border border-prophet-border bg-prophet-panel flex flex-col gap-2 p-4">
        <h2 className="m-0 text-lg font-[500] text-prophet-foreground">{t("selectSolanaWallet")}</h2>
        {sortedWallets.length === 0 ? (
          <p className="m-0 text-sm text-[#909090]">{t("noSolanaWalletDetected")}</p>
        ) : (
          sortedWallets.map((wallet) => (
            <button
              key={wallet.adapter.name}
              type="button"
              disabled={connecting}
              className="flex items-center gap-3 rounded-lg border border-[#ececec] px-4 py-3 text-left transition-colors hover:bg-[#f8f8f8]"
              onClick={() => void handleSelect(wallet)}
            >
              <div className="flex items-center gap-3">
                {wallet.adapter.icon ? (
                  <Image
                    src={wallet.adapter.icon}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <span className="size-8 rounded-full bg-[#f4f4f4]" />
                )}
                <span className="text-base font-[500] text-prophet-foreground">{wallet.adapter.name}</span>
              </div>
              {
                wallet.readyState === "Installed" && (
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
