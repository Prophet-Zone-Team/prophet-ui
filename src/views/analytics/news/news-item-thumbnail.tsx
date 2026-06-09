import Image from "next/image";

import { cn } from "@/lib/cn";

export type NewsItemThumbnailProps = {
  alt: string;
  imageUrl?: string;
  className?: string;
};

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NewsItemThumbnail({
  alt,
  imageUrl,
  className
}: NewsItemThumbnailProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={72}
        height={72}
        unoptimized
        className={cn(
          "size-[72px] shrink-0 rounded-[12px] object-cover",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-[72px] shrink-0 place-items-center rounded-[12px]",
        "bg-[linear-gradient(135deg,#E8ECF4_0%,#C5CEDE_100%)]",
        "text-[20px] font-[500] text-[#5A6478]",
        className
      )}
      aria-label={alt}
    >
      {getInitials(alt)}
    </div>
  );
}
