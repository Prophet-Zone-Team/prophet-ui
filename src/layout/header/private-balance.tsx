import { cn } from "@/lib/cn";

function PrivateBalance(props: any) {
  const { onClick, className } = props;

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer text-[#909090] text-sm font-[400] px-2.5 rounded-lg border border-[#FFFFFF] h-[50px] flex flex-col items-end justify-center gap-0 transition-colors hover:border-[#EBEBEB]",
        className,
      )}
      onClick={onClick}
      aria-label="Open Private Topup"
    >
      <div className="flex items-center justify-center gap-1 leading-[17px]">
        <img
          src="/icons/icon-private.svg"
          alt=""
          className="shrink-0 w-4 h-3 object-center object-contain"
        />
        <div className="">Private Balance</div>
      </div>
      <div className="text-black text-base leading-[19px]">$0.00</div>
    </button>
  );
}

export default PrivateBalance;
