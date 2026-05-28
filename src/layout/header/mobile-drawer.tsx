import Drawer from "@/components/drawer";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import PrivateBalance from "./private-balance";
import { walletBalanceLabelClass, walletBalanceValueClass } from "./wallet-menu-ui";
import NavBar from "./navigation-bar";
import { cn } from "@/lib/cn";
import Link from "next/link";

function MobileDrawer(props: any) {
  const {
    open,
    onClose,
    regionRestricted,
    onPrivateBalanceClick,
    balanceDisplay,
  } = props;

  return (
    <Drawer
      title={(
        <Link
          href="/fifa"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <img
            src="/logo.svg"
            alt=""
            width={29}
            height={27}
            className="block"
            aria-hidden
          />
          PROPHET
        </Link>
      )}
      open={open}
      onClose={onClose}
      direction="top"
    >
      <div className="">
        <div className="px-4 flex justify-between items-center gap-5">
          <RegionRestrictedControl restricted={regionRestricted}>
            <PrivateBalance
              onClick={() => {
                onPrivateBalanceClick?.();
                onClose?.();
              }}
              className="!items-start"
            />
          </RegionRestrictedControl>
          <div className="flex flex-col justify-center items-start gap-0 rounded-lg border border-[#EBEBEB] h-[50px] px-2.5 min-w-[150px]">
            <span className={walletBalanceLabelClass}>Balance</span>
            <span className={cn(walletBalanceValueClass, "text-black !text-base")}>${balanceDisplay}</span>
          </div>
        </div>
        <NavBar
          className="flex flex-col items-stretch gap-0 mt-5"
          navClassName="border-b border-prophet-line !rounded-none justify-center last:border-b-0 h-[60px]"
          activeClassName="!rounded-none"
          onClick={onClose}
        />
      </div>
    </Drawer>
  );
};

export default MobileDrawer;
