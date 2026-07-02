import { cn } from "@/lib/cn";
import { walletLoginButtonClass } from "@/layout/header/wallet-menu-ui";

export interface WalletLoginButtonProps {
  label: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function WalletLoginButton({
  label,
  className,
  disabled,
  onClick,
}: WalletLoginButtonProps) {
  return (
    <button
      type="button"
      className={cn(walletLoginButtonClass, className)}
      disabled={disabled}
      onClick={onClick}
    >
      <LoginUserIcon />
      <span className="truncate">{label}</span>
    </button>
  );
}

function LoginUserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle
        cx="8"
        cy="4.5"
        r="3"
        stroke="white"
        strokeWidth="2"
      />
      <path
        d="M15 15C15 12.5147 12.7614 10.5 10 10.5H6C3.23858 10.5 1 12.5147 1 15"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
}
