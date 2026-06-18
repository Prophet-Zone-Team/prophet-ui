export function MobileOddsCountBadge({ count }: { count: number }) {
  return (
    <span
      className="inline-flex h-[26px] min-w-[26px] shrink-0 items-center justify-center rounded-lg px-1 text-xs font-[600] leading-[15px] text-white"
      style={{
        background:
          "linear-gradient(360deg, rgba(45, 151, 243, 0.5) 0%, rgba(177, 68, 255, 0.5) 100%), #FFFFFF"
      }}
      aria-hidden
    >
      {count}
    </span>
  );
}
