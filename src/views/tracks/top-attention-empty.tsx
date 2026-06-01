export function TopAttentionEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#EBEBEB] bg-[#FAFAFA] px-4 py-10 md:py-12">
      <p className="m-0 max-w-[320px] text-center text-[14px] font-[400] leading-[18px] text-[#909090]">
        No popular subscription rankings are available right now. Check back
        later for the most-tracked teams and matches.
      </p>
    </div>
  );
}
