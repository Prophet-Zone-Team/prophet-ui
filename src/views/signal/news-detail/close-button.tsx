import { cn } from "@/lib/cn";

export type SignalNewsDetailCloseButtonProps = {
  onClick: () => void;
  className?: string;
};

export function SignalNewsDetailCloseButton({
  onClick,
  className
}: SignalNewsDetailCloseButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-[10px] w-[10px] items-center justify-center p-0",
        className
      )}
      aria-label="Close news detail"
      onClick={onClick}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1 1L9 9M9 1L1 9"
          stroke="#909090"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
