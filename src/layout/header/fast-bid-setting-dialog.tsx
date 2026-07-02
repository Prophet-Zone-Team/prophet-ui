"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  FAST_BID_PRESET_AMOUNTS,
  formatFastBidAmountDisplay,
  MIN_FAST_BID_AMOUNT,
  normalizeFastBidAmount,
  useFastBidAmount,
  useSetFastBidAmount
} from "@/store/user-config-store";
import { fundingModalCardClass } from "@/views/portfolio/shared/funding-modal-shell";

export interface FastBidSettingDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FastBidSettingDialog({
  open,
  onClose
}: FastBidSettingDialogProps) {
  const t = useTranslations("wallet");
  const fastBidAmount = useFastBidAmount();
  const setFastBidAmount = useSetFastBidAmount();
  const [draftInput, setDraftInput] = useState(String(fastBidAmount));

  useEffect(() => {
    if (open) {
      setDraftInput(String(fastBidAmount));
    }
  }, [fastBidAmount, open]);

  function handleSave() {
    const parsed = Number(draftInput);
    const normalized = normalizeFastBidAmount(parsed);
    setFastBidAmount(normalized);
    onClose();
  }

  function handleInputChange(value: string) {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDraftInput(value);
    }
  }

  function handlePresetSelect(amount: number) {
    setDraftInput(String(amount));
  }

  const parsedDraft = Number(draftInput);
  const isSaveDisabled =
    draftInput === "" ||
    !Number.isFinite(parsedDraft) ||
    parsedDraft < MIN_FAST_BID_AMOUNT;

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("fastBidSetting")}
      className="w-[320px]"
      hideCloseButton
    >
      <div className={cn(fundingModalCardClass, "w-[320px]")}>
        <header className="relative flex shrink-0 items-center px-5 pb-4 pt-5">
          <h2 className="m-0 text-xl font-[500] leading-6 text-prophet-foreground">
            {t("fastBidSetting")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 inline-flex h-[10px] w-[10px] items-center justify-center border-0 bg-transparent p-0 text-prophet-muted transition-opacity hover:opacity-70"
            aria-label={t("close")}
          >
            <span
              className="relative block h-[10px] w-[10px]"
              aria-hidden="true"
            >
              <span className="absolute left-1/2 top-0 h-[10px] w-[1.6px] -translate-x-1/2 rotate-45 bg-current" />
              <span className="absolute left-1/2 top-0 h-[10px] w-[1.6px] -translate-x-1/2 -rotate-45 bg-current" />
            </span>
          </button>
        </header>

        <div className="flex flex-col items-center px-5 pb-5">
          <label className="inline-flex items-center justify-center">
            <span className="text-[36px] flex-1 font-[500] leading-[43px] text-prophet-foreground">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={draftInput}
              onChange={(event) => handleInputChange(event.target.value)}
              aria-label={t("fastBidAmount")}
              style={{ fieldSizing: "content" }}
              className="max-w-full border-0 bg-transparent text-[36px] font-[500] leading-[43px] text-prophet-foreground outline-none focus:ring-0"
            />
          </label>

          <div className="mt-6 flex items-center justify-center gap-2">
            {FAST_BID_PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                className="inline-flex h-[30px] min-w-[50px] items-center justify-center rounded-lg border border-prophet-line bg-prophet-panel px-3 text-sm font-[400] leading-[17px] text-prophet-muted transition-colors hover:border-prophet-muted hover:text-prophet-foreground"
                onClick={() => handlePresetSelect(amount)}
              >
                {formatFastBidAmountDisplay(amount)}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isSaveDisabled}
            className="mt-8 inline-flex h-[50px] w-[280px] items-center justify-center rounded-xl bg-prophet-primary text-base font-[400] leading-[19px] text-prophet-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSave}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
