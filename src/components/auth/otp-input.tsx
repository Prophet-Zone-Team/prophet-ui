"use client";

import { useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

interface OtpInputProps {
  value: string;
  length?: number;
  disabled?: boolean;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
}

export function OtpInput({
  value,
  length = 6,
  disabled = false,
  onChange,
  onComplete,
}: OtpInputProps) {
  const t = useTranslations("auth");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const focusInput = (index: number) => {
    const target = inputsRef.current[index];
    target?.focus();
    target?.select();
  };

  const commit = (next: string) => {
    const normalized = next.slice(0, length);
    onChange(normalized);

    if (normalized.length === length) {
      onComplete?.(normalized);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const sanitized = raw.replace(/\D/g, "");

    if (!sanitized) {
      const next = digits.slice();
      next[index] = "";
      commit(next.join("").replace(/\s/g, ""));
      return;
    }

    const chars = sanitized.split("");
    const next = digits.slice();
    let cursor = index;

    for (const char of chars) {
      if (cursor >= length) {
        break;
      }
      next[cursor] = char;
      cursor += 1;
    }

    commit(next.join(""));
    focusInput(Math.min(cursor, length - 1));
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = digits.slice();

      if (next[index]) {
        next[index] = "";
        commit(next.join(""));
        return;
      }

      if (index > 0) {
        next[index - 1] = "";
        commit(next.join(""));
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");

    if (!pasted) {
      return;
    }

    commit(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex items-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit}
          aria-label={t("verificationCodeDigit", { index: index + 1 })}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            "size-[42px] rounded-[6px] border border-[#ebebeb] bg-white text-center",
            "text-[16px] font-[500] text-black outline-none",
            "focus:border-black disabled:opacity-50",
          )}
        />
      ))}
    </div>
  );
}
