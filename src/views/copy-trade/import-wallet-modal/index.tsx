"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { copyTradePrimaryButtonClass, copyTradeModalSurfaceClass } from "@/views/copy-trade/copy-trade-ui";
import { validateImportWalletAddress } from "@/lib/copy-trade/import-wallet";
import { useImportCopyTrader } from "@/views/copy-trade/use-import-copy-trader";

export interface ImportWalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportWalletModal({ open, onClose }: ImportWalletModalProps) {
  const t = useTranslations("copyTrade.importWallet");
  const [walletAddress, setWalletAddress] = useState("");
  const { importing, importWallet } = useImportCopyTrader();

  useEffect(() => {
    if (!open) {
      setWalletAddress("");
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    const validation = validateImportWalletAddress(walletAddress);
    return validation.ok && !importing;
  }, [importing, walletAddress]);

  const handleSubmit = useCallback(async () => {
    const ok = await importWallet(walletAddress);
    if (ok) {
      onClose();
    }
  }, [importWallet, onClose, walletAddress]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("ariaLabel")}
      className={copyTradeModalSurfaceClass}
      closeButtonClassName="right-5 top-5 h-[10px] w-[10px] border-0 bg-transparent p-0 text-prophet-muted hover:bg-transparent hover:text-prophet-foreground"
      closeIconClassName="h-[10px] w-[10px] stroke-[1.6]"
    >
      <div className="flex flex-col gap-3">
        <header>
          <h2 className="text-xl font-medium leading-[25px] text-prophet-foreground">
            {t("title")}
          </h2>
        </header>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="import-wallet-address"
            className="text-sm leading-[18px] text-prophet-foreground"
          >
            {t("trackWalletLabel")}
          </label>

          <input
            id="import-wallet-address"
            type="text"
            value={walletAddress}
            onChange={(event) => setWalletAddress(event.target.value)}
            placeholder={t("placeholder")}
            autoComplete="off"
            spellCheck={false}
            disabled={importing}
            className={cn(
              "box-border h-[50px] w-full rounded-lg border border-prophet-line bg-prophet-panel",
              "px-3 text-sm leading-[18px] text-prophet-foreground outline-none",
              "placeholder:text-prophet-muted/30",
              "focus:border-prophet-muted",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          />
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
          className={cn(
            "inline-flex h-[50px] w-full items-center justify-center rounded-lg text-base leading-5",
            copyTradePrimaryButtonClass
          )}
        >
          {importing ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            t("submit")
          )}
        </button>
      </div>
    </Modal>
  );
}
