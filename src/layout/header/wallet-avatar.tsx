import { ProphetMarkIcon } from "@/components/icons/prophet-mark-icon";
import { cn } from "@/lib/cn";

export interface WalletAvatarProps {
  address: string;
  size?: "sm" | "lg";
  className?: string;
}

const sizeClassName = {
  sm: "size-6",
  lg: "size-[52px]"
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
