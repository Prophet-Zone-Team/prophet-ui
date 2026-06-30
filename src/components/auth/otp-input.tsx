"use client";

import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";

interface OtpInputProps {
  value: string;
  length?: number;
  disabled?: boolean;
  className?: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
}

export function OtpInput({
  value,
  length = 6,
  disabled = false,
  className,
  onChange,
  onComplete,
}: OtpInputProps) {
  const isMobile = useDevice();

  if (isMobile) {
    return (
      <MobileOtpInput
        value={value}
        length={length}
        disabled={disabled}
        className={className}
        onChange={onChange}
        onComplete={onComplete}
      />
    );
  }

  return (
    <DesktopOtpInput
      value={value}
      length={length}
      disabled={disabled}
      className={className}
      onChange={onChange}
      onComplete={onComplete}
    />
  );
}

function MobileOtpInput({
  value,
  length = 6,
  disabled = false,
  className,
  onChange,
  onComplete,
}: OtpInputProps) {
  const t = useTranslations("auth");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = Array.from({ length }, (_, index) => value[index] ?? "");
  const activeIndex = Math.min(value.length, length - 1);

  const commit = (next: string) => {
    const normalized = next.slice(0, length);
    onChange(normalized);

    if (normalized.length === length) {
      onComplete?.(normalized);
    }
  };

  const handleChange = (raw: string) => {
    const sanitized = raw.replace(/\D/g, "");
    commit(sanitized);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");

    if (!pasted) {
      return;
    }

    commit(pasted);
  };

  return (
    <div
      className={cn(
        "relative grid min-w-0 grid-cols-6 gap-1",
        "w-full sm:w-auto",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        disabled={disabled}
        value={value}
        aria-label={t("verificationCodeDigit", { index: 1 })}
        onChange={(event) => handleChange(event.target.value)}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 z-10 cursor-text opacity-0"
      />
      {digits.map((digit, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            "flex h-11 w-full min-w-0 items-center justify-center rounded-[6px] border border-prophet-line bg-white dark:bg-[#17171A]",
            "text-[16px] font-[500] text-black",
            isFocused && index === activeIndex && "border-black",
            disabled && "opacity-50",
          )}
        >
          {digit}
        </div>
      ))}
    </div>
  );
}

function DesktopOtpInput({
  value,
  length = 6,
  disabled = false,
  className,
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
    <div
      className={cn(
        "grid min-w-0 grid-cols-6 gap-1 sm:gap-2",
        "w-full sm:w-auto",
        className,
      )}
    >
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
            "aspect-square w-full min-w-0 rounded-[6px] border border-prophet-line bg-white dark:bg-[#17171A] text-center",
            "text-[16px] font-[500] text-black dark:text-white outline-none",
            "focus:border-black disabled:opacity-50",
            "sm:size-[42px]",
          )}
        />
      ))}
    </div>
  );
}
