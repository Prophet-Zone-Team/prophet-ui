export function TicketDivider() {
  return (
    <div className="relative px-4">
      <div
        className="pointer-events-none absolute -left-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white"
        aria-hidden
      />
      <div className="border-t border-dashed border-[#CBCBCB]" />
    </div>
  );
}
