import { cn } from "@/lib/cn";

export interface UserProfileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function UserProfileCard({ children, className }: UserProfileCardProps) {
  return (
    <section
      className={cn(
        "box-border w-[355px] rounded-xl border border-[#EBEBEB] bg-white",
        className
      )}
    >
      {children}
    </section>
  );
}
