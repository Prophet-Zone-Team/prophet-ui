"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { getStableflowWalletLogo } from "@/utils/logo";

import {
  openBinanceWallet,
  openMetaMaskWallet,
  openOkxWallet,
  openTokenPocket,
} from "../utils";

export type WalletId = "tokenpocket" | "okx" | "metamask" | "binance" | "others";

export type WalletOption = {
  id: WalletId;
  name: string;
  icon: string;
  descriptionKey:
    | "walletTokenPocketDescription"
    | "walletOkxDescription"
    | "walletMetaMaskDescription"
    | "walletBinanceDescription"
    | "walletOthersDescription";
  downloadUrl: string;
};

export const walletOptions: WalletOption[] = [
  {
    id: "tokenpocket",
    name: "TokenPocket",
    icon: getStableflowWalletLogo("logo-tokenpocket.png"),
    descriptionKey: "walletTokenPocketDescription",
    downloadUrl: "https://www.tokenpocket.pro/",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: getStableflowWalletLogo("logo-okx.png"),
    descriptionKey: "walletOkxDescription",
    downloadUrl: "https://www.okx.com/web3",
  },
  {
    id: "metamask",
    name: "MetaMask",
    icon: getStableflowWalletLogo("logo-metamask.png"),
    descriptionKey: "walletMetaMaskDescription",
    downloadUrl: "https://metamask.io/download",
  },
  {
    id: "binance",
    name: "Binance Web3 Wallet",
    icon: getStableflowWalletLogo("logo-binance.png"),
    descriptionKey: "walletBinanceDescription",
    downloadUrl: "https://www.binance.com/en/web3wallet",
  },
  {
    id: "others",
    name: "Others",
    icon: getStableflowWalletLogo("logo-walletconnect.png"),
    descriptionKey: "walletOthersDescription",
    downloadUrl: "",
  },
];

const walletLaunchChecks: Record<WalletId, (params?: { checkOnly?: boolean }) => boolean> = {
  tokenpocket: openTokenPocket,
  okx: openOkxWallet,
  metamask: openMetaMaskWallet,
  binance: openBinanceWallet,
  others: () => true,
};

export function getAvailableWallets() {
  return walletOptions.filter((wallet) => walletLaunchChecks[wallet.id]({ checkOnly: true }));
}

export function launchWalletApp(walletId: WalletId) {
  return walletLaunchChecks[walletId]({ checkOnly: false });
}

const modalCardClass = cn(
  "w-full max-w-[420px] rounded-[24px] border border-prophet-line bg-prophet-panel px-6 py-8",
  "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
);

const walletCardClass = cn(
  "flex w-full items-center gap-3 rounded-xl border border-prophet-line bg-prophet-panel p-4",
  "text-left transition-colors hover:bg-[#fafbfc]",
);

export type WalletSelectorModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (walletId: WalletId) => void;
};

export function WalletSelectorModal({ open, onClose, onSelect }: WalletSelectorModalProps) {
  const t = useTranslations("wallet");
  const availableWallets = getAvailableWallets();

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("selectWalletTitle")}
      className={modalCardClass}
      overlayClassName="backdrop-blur-sm"
      hideCloseButton
    >
      <div className="text-center">
        <h2 className="m-0 text-xl font-semibold leading-tight text-[#18110F]">
          {t("selectWalletTitle")}
        </h2>
        <p className="mt-2 text-sm text-prophet-muted">
          {t("selectWalletSubtitle")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {availableWallets.length > 0 ? (
          availableWallets.map((wallet: any) => (
            <button
              key={wallet.id}
              type="button"
              className={walletCardClass}
              onClick={() => onSelect(wallet.id)}
            >
              <Image
                src={wallet.icon}
                alt={wallet.name}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-[#18110F]">
                  {wallet.name}
                </span>
                <span className="mt-0.5 block text-sm text-prophet-muted">
                  {t(wallet.descriptionKey)}
                </span>
              </span>
              {/* {
                !!wallet.downloadUrl && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${wallet.name} download page`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-prophet-muted transition-colors hover:bg-[#f3f4f6] hover:text-[#18110F]"
                    onClick={(event) => {
                      event.stopPropagation();
                      window.open(wallet.downloadUrl, "_blank", "noopener,noreferrer");
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      window.open(wallet.downloadUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </span>
                )
              } */}
            </button>
          ))
        ) : (
          <p className="m-0 text-center text-sm text-prophet-muted">
            {t("selectWalletEmpty")}
          </p>
        )}
      </div>
    </Modal>
  );
}
