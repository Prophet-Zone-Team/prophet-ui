"use client";

import {
  bindTgDisconnectButtonClass,
  bindTgPrimaryButtonClass,
  bindTgPrimaryMutedButtonClass,
  bindTgSecondaryButtonClass,
  bindTgSuccessButtonClass,
} from "@/components/bind-tg/bind-tg-ui";

interface BindTgFooterProps {
  primaryLabel: string;
  secondaryLabel: string;
  primaryVariant?: "default" | "muted" | "success";
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export function BindTgFooter({
  primaryLabel,
  secondaryLabel,
  primaryVariant = "default",
  onPrimaryClick,
  onSecondaryClick,
}: BindTgFooterProps) {
  const primaryClass =
    primaryVariant === "success"
      ? bindTgSuccessButtonClass
      : primaryVariant === "muted"
        ? bindTgPrimaryMutedButtonClass
        : bindTgPrimaryButtonClass;

  return (
    <div className="flex flex-col gap-3">
      <button type="button" className={primaryClass} onClick={onPrimaryClick}>
        {primaryLabel}
      </button>
      {primaryVariant !== "success" && (
        <button
          type="button"
          className={bindTgSecondaryButtonClass}
          onClick={onSecondaryClick}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
