"use client";

export interface BindTgCloseProps {
  onClose: () => void;
}

export function BindTgClose({ onClose }: BindTgCloseProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-5 top-5 inline-flex h-[12px] w-[12px] items-center justify-center border-0 bg-transparent p-0 text-[#909090] transition-opacity hover:opacity-70"
      aria-label="Close"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M10.7998 0.800781L0.799805 10.8008"
          stroke="#909090"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M0.799804 0.800781L10.7998 10.8008"
          stroke="#909090"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
