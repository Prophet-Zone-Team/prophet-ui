"use client";

import { useTranslations } from "next-intl";

import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import type { FundingWalletChainType } from "@/store/use-funding-wallet-store";

const CHAIN_OPTIONS: Array<{
  id: FundingWalletChainType;
  labelKey: "evm" | "solana" | "tron" | "near";
}> = [
    { id: "evm", labelKey: "evm" },
    { id: "solana", labelKey: "solana" },
    { id: "tron", labelKey: "tron" },
    { id: "near", labelKey: "near" },
  ];

export interface PrivateTopupChainPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (chainType: FundingWalletChainType) => void;
}

export function PrivateTopupChainPicker({
  open,
  onClose,
  onSelect,
}: PrivateTopupChainPickerProps) {
  const t = useTranslations("privateTopup");

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("selectFundingWalletChain")}
      className="max-w-[400px]"
    >
      <div className="w-[350px] rounded-[16px] border border-prophet-border bg-prophet-panel flex flex-col gap-2 p-4">
        <h2 className="m-0 text-lg font-[500] text-prophet-foreground">
          {t("selectFundingWalletChain")}
        </h2>
        <div className="w-full mt-2 flex flex-col gap-2">
          {CHAIN_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="rounded-lg border border-prophet-line px-4 py-3 text-left text-base font-[500] text-prophet-foreground transition-colors hover:bg-prophet-hover"
              onClick={() => {
                onSelect(option.id);
                onClose();
              }}
            >
              {t(`fundingChain.${option.labelKey}`)}
            </button>
          ))}
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
