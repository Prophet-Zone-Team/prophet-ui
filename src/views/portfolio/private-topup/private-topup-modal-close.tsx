"use client";

export interface PrivateTopupModalCloseProps {
  onClose: () => void;
  className?: string;
}

export function PrivateTopupModalClose({
  onClose,
  className = "absolute right-5 top-5",
}: PrivateTopupModalCloseProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`${className} inline-flex h-[10px] w-[10px] items-center justify-center border-0 bg-transparent p-0 text-[#909090] transition-opacity hover:opacity-70`}
      aria-label="Close"
    >
      <span className="relative block h-[10px] w-[10px]" aria-hidden="true">
        <span className="absolute left-1/2 top-0 h-[10px] w-[1.6px] -translate-x-1/2 rotate-45 bg-current" />
        <span className="absolute left-1/2 top-0 h-[10px] w-[1.6px] -translate-x-1/2 -rotate-45 bg-current" />
      </span>
    </button>
  );
}

export function PrivateTopupProceedChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="11"
      viewBox="0 0 5 11"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M1 1L4 5.5L1 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
