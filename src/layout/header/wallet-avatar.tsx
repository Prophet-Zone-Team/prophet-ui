import { cn } from "@/lib/cn";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";

export interface WalletAvatarProps {
  address: string;
  size?: "sm" | "lg";
  className?: string;
}

const sizeClassName = {
  sm: "size-6",
  lg: "size-[52px] border-4 border-white shadow-[0_0_4px_rgba(0,0,0,0.25)]",
} as const;

export function WalletAvatar({
  address,
  size = "sm",
  className,
}: WalletAvatarProps) {
  return (
    <span
      className={cn("shrink-0 rounded-full", sizeClassName[size], className)}
      style={{ background: getWalletAvatarGradient(address) }}
      aria-hidden="true"
    />
  );
}
