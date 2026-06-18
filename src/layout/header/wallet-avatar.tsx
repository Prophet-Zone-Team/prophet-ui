import { ProphetMarkIcon } from "@/components/icons/prophet-mark-icon";
import { cn } from "@/lib/cn";

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
  size = "sm",
  className,
}: WalletAvatarProps) {
  return (
    <ProphetMarkIcon
      className={cn(sizeClassName[size], className)}
      aria-hidden="true"
    />
  );
}
