import { cn } from "@/lib/cn";

export interface CopyTradeListStatusMessageProps {
  children: string;
  className?: string;
}

export function CopyTradeListStatusMessage({
  children,
  className
}: CopyTradeListStatusMessageProps) {
  return (
    <p
      className={cn(
        "px-4 py-10 text-center text-[14px] leading-[17px] text-prophet-muted md:px-0",
        className
      )}
    >
      {children}
    </p>
  );
}
