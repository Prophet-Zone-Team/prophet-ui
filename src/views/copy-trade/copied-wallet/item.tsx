"use client";

import { useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CopyIcon } from "@/components/icons";
import Popover from "@/components/popover";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { cn } from "@/lib/cn";
import {
  getCopyTargetTotalCapUsage,
  isCopyTargetTotalCapReached
} from "@/lib/copy-trade/copy-target-cap";
import type { CopyTargetDisplayStats } from "@/lib/copy-trade/target-stats";
import {
  isUserImportedTrader,
  traderTag,
  type TraderTag
} from "@/lib/copy-trade/trader-catalog-stats";
import { formatCompactRelativeTime } from "@/lib/formatters/datetime";
import {
  formatTeamDetailMoney,
  formatShortWallet
} from "@/lib/team/detail-format";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";
import type { CopyTarget, TraderCatalogEntry } from "@/types/copy-trade-api";
import {
  copyTradeTableMobileCardClass
} from "@/views/copy-trade/copy-trade-ui";
import {
  SmartMoneyIcon,
  WhaleIcon
} from "@/views/copy-trade/rank/trader-tag-icons";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";

import {
  copyTradeCopiedWalletColActionClass,
  copyTradeCopiedWalletColDataClass,
  copyTradeCopiedWalletColWalletClass,
  copyTradeCopiedWalletGridStyle,
  copyTradeCopiedWalletRowGridClass
} from "./grid";
import { CopyTradeCopiedWalletPositionsPanel } from "./positions-panel";
import { useCopyTradeTargetPositions } from "./use-copy-trade-target-positions";

export interface CopyTradeCopiedWalletItemProps {
  target: CopyTarget;
  trader?: TraderCatalogEntry | null;
  stats?: CopyTargetDisplayStats | null;
  saving?: boolean;
  onManage?: (target: CopyTarget) => void;
  onPauseToggle?: (target: CopyTarget) => void;
  onRemove?: (target: CopyTarget) => void;
  layout?: "desktop" | "mobile";
  className?: string;
}

function TraderAvatar({ wallet }: { wallet: string }) {
  return (
    <div
      className="size-9 shrink-0 rounded-full"
      style={{ background: getWalletAvatarGradient(wallet) }}
      aria-hidden="true"
    />
  );
}

function TraderTagIcon({ tag }: { tag: TraderTag }) {
  return (
    <span className="inline-flex shrink-0 items-center" aria-hidden="true">
      {tag === "whale" ? <WhaleIcon /> : <SmartMoneyIcon />}
    </span>
  );
}

function formatMoneyOrDash(value: number | null | undefined): string {
  if (value == null || value === 0) {
    return "--";
  }

  return formatTeamDetailMoney(value);
}

function formatPnlValue(stats?: CopyTargetDisplayStats | null): string {
  if (stats?.pnl == null) {
    return "--";
  }

  const sign = stats.pnl > 0 ? "+" : stats.pnl < 0 ? "-" : "";
  return `${sign}${formatTeamDetailMoney(Math.abs(stats.pnl))}`;
}

function CopyStatusIndicator({
  active,
  capReached = false
}: {
  active: boolean;
  capReached?: boolean;
}) {
  const showCapWarning = active && capReached;

  return (
    <span
      className={cn(
        "inline-flex h-5 w-[23px] shrink-0 items-center justify-center rounded-md",
        showCapWarning
          ? "bg-[#fdd357]/30"
          : active
            ? "bg-[#65AF14]/20"
            : "bg-[#909090]/20"
      )}
      aria-hidden="true"
    >
      {showCapWarning ? (
        <span className="text-[11px] font-bold leading-none text-[#d1a00f]">
          !
        </span>
      ) : active ? (
        <span className="ml-0.5 size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-[#65AF14]" />
      ) : (
        <span className="flex items-center gap-[3px]">
          <span className="h-[13px] w-1 rounded-[1px] bg-[#909090]" />
          <span className="h-[13px] w-1 rounded-[1px] bg-[#909090]" />
        </span>
      )}
    </span>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
  children
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
        "border border-[#EBEBEB] bg-white text-[#909090] transition-opacity",
        "hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
      )}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function CopyTradeCopiedWalletItem({
  target,
  trader = null,
  stats = null,
  saving = false,
  onManage,
  onPauseToggle,
  onRemove,
  layout = "desktop",
  className
}: CopyTradeCopiedWalletItemProps) {
  const t = useTranslations("copyTrade.copiedWallet");
  const { copy } = useCopyWithToast();
  const [expanded, setExpanded] = useState(false);
  const displayName = trader?.DisplayName || formatShortWallet(target.Wallet);
  const walletLabel = formatShortWallet(target.Wallet);
  const tag = trader ? traderTag(trader) : "";
  const imported = trader ? isUserImportedTrader(trader) : false;
  const isActive = target.Enabled;
  const totalCapReached = isCopyTargetTotalCapReached(target);
  const totalCapUsage = getCopyTargetTotalCapUsage(target);
  const pnlValue = stats?.pnl ?? null;
  const lastTradeLabel = stats?.lastTradeAt
    ? formatCompactRelativeTime(stats.lastTradeAt)
    : "--";

  const pnlTone =
    pnlValue == null
      ? undefined
      : pnlValue >= 0
        ? "text-[#65AF14]"
        : "text-[#FF674B]";

  const handleRowClick = () => {
    setExpanded((current) => !current);
  };

  const stopRowToggle = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const [endedEnabled, setEndedEnabled] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setEndedEnabled(false);
    }
  }, [expanded]);

  const targetPositions = useCopyTradeTargetPositions({
    wallet: target.Wallet,
    enabled: expanded,
    endedEnabled
  });

  const positionsPanel = expanded ? (
    <CopyTradeCopiedWalletPositionsPanel
      activePositions={targetPositions.activePositions}
      endedPositions={targetPositions.endedPositions}
      activePage={targetPositions.activePage}
      endedPage={targetPositions.endedPage}
      activeHasMore={targetPositions.activeHasMore}
      endedHasMore={targetPositions.endedHasMore}
      loadingActive={targetPositions.loadingActive}
      loadingEnded={targetPositions.loadingEnded}
      errorActive={targetPositions.errorActive}
      errorEnded={targetPositions.errorEnded}
      onActivePageChange={targetPositions.setActivePage}
      onEndedPageChange={targetPositions.setEndedPage}
      onStatusChange={(status) => {
        if (status === "ended") {
          setEndedEnabled(true);
        }
      }}
      onClick={stopRowToggle}
    />
  ) : null;

  const rowKeyHandlers = {
    role: "button" as const,
    tabIndex: 0,
    "aria-expanded": expanded,
    "aria-label": `${displayName} copied wallet details`,
    onClick: handleRowClick,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleRowClick();
      }
    }
  };

  if (layout === "mobile") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-[#EBEBEB] bg-white",
          className
        )}
      >
        <article
          className={cn(copyTradeTableMobileCardClass, "border-0")}
          {...rowKeyHandlers}
        >
          <WalletIdentityBlock
            active={isActive}
            capReached={totalCapReached}
            capUsage={totalCapUsage}
            wallet={target.Wallet}
            displayName={displayName}
            walletLabel={walletLabel}
            imported={imported}
            tag={tag}
            onCopyWallet={(event) => {
              stopRowToggle(event);
              void copy(target.Wallet);
            }}
          />

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <PortfolioTableMobileField label={t("totalBuy")}>
              {formatMoneyOrDash(stats?.totalBuy)}
            </PortfolioTableMobileField>
            <PortfolioTableMobileField label={t("totalSell")}>
              {formatMoneyOrDash(stats?.totalSell)}
            </PortfolioTableMobileField>
            <PortfolioTableMobileField label={t("buySell")}>
              <span className="text-[#65AF14]">{stats?.buyCount ?? 0}</span>
              <span className="text-[#909090]">/</span>
              <span className="text-[#FF674B]">{stats?.sellCount ?? 0}</span>
            </PortfolioTableMobileField>
            <PortfolioTableMobileField
              label={t("pnl")}
              valueClassName={pnlTone}
            >
              {formatPnlValue(stats)}
            </PortfolioTableMobileField>
            <PortfolioTableMobileField
              label={t("lastTrade")}
              valueClassName="font-normal text-[#909090]"
            >
              {lastTradeLabel}
            </PortfolioTableMobileField>
          </div>

          <WalletActionButtons
            active={isActive}
            saving={saving}
            onPauseToggle={() => onPauseToggle?.(target)}
            onManage={() => onManage?.(target)}
            onRemove={() => onRemove?.(target)}
            onClick={stopRowToggle}
            className="justify-end border-t border-[#EBEBEB] pt-3"
          />
        </article>

        {positionsPanel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "col-span-full overflow-hidden rounded-xl border border-[#EBEBEB] bg-white",
        className
      )}
    >
      <article
        style={copyTradeCopiedWalletGridStyle}
        className={cn(
          "box-border h-[74px] cursor-pointer px-4 transition-colors hover:bg-[#FAFAFA]",
          copyTradeCopiedWalletRowGridClass
        )}
        {...rowKeyHandlers}
      >
        <WalletIdentityBlock
          active={isActive}
          capReached={totalCapReached}
          capUsage={totalCapUsage}
          wallet={target.Wallet}
          displayName={displayName}
          walletLabel={walletLabel}
          imported={imported}
          tag={tag}
          onCopyWallet={(event) => {
            stopRowToggle(event);
            void copy(target.Wallet);
          }}
        />

        <span
          className={cn(
            copyTradeCopiedWalletColDataClass,
            "text-[16px] leading-5 text-black"
          )}
        >
          {formatMoneyOrDash(stats?.totalBuy)}
        </span>
        <span
          className={cn(
            copyTradeCopiedWalletColDataClass,
            "text-[16px] leading-5 text-black"
          )}
        >
          {formatMoneyOrDash(stats?.totalSell)}
        </span>
        <span
          className={cn(
            copyTradeCopiedWalletColDataClass,
            "text-[16px] leading-5 tabular-nums"
          )}
        >
          <span className="text-[#65AF14]">{stats?.buyCount ?? 0}</span>
          <span className="text-[#909090]">/</span>
          <span className="text-[#FF674B]">{stats?.sellCount ?? 0}</span>
        </span>
        <span
          className={cn(
            copyTradeCopiedWalletColDataClass,
            "text-[16px] leading-5 tabular-nums",
            pnlTone
          )}
        >
          {formatPnlValue(stats)}
        </span>
        <span
          className={cn(
            copyTradeCopiedWalletColDataClass,
            "text-[14px] leading-[18px] text-black"
          )}
        >
          {lastTradeLabel}
        </span>

        <WalletActionButtons
          active={isActive}
          saving={saving}
          onPauseToggle={() => onPauseToggle?.(target)}
          onManage={() => onManage?.(target)}
          onRemove={() => onRemove?.(target)}
          onClick={stopRowToggle}
        />
      </article>

      {positionsPanel}
    </div>
  );
}

function WalletIdentityBlock({
  active,
  capReached = false,
  capUsage = null,
  wallet,
  displayName,
  walletLabel,
  imported,
  tag,
  onCopyWallet
}: {
  active: boolean;
  capReached?: boolean;
  capUsage?: { used: number; max: number } | null;
  wallet: string;
  displayName: string;
  walletLabel: string;
  imported: boolean;
  tag: TraderTag | "";
  onCopyWallet: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const t = useTranslations("copyTrade.copiedWallet");
  const tCommon = useTranslations("copyTrade.common");
  const capDetail =
    capReached && capUsage
      ? t("totalCapReachedDetail", {
          used: formatTeamDetailMoney(capUsage.used),
          max: formatTeamDetailMoney(capUsage.max)
        })
      : null;
  const statusIndicator = (
    <CopyStatusIndicator active={active} capReached={capReached} />
  );

  return (
    <div
      className={cn(
        copyTradeCopiedWalletColWalletClass,
        "flex min-w-0 items-center gap-3"
      )}
    >
      {capDetail ? (
        <Popover
          placement="TopLeft"
          trigger="Hover"
          offset={8}
          contentClassName="z-[70]"
          content={
            <div className="max-w-[280px] rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-xs leading-[150%] text-[#d1a00f] shadow-[0px_0px_10px_rgba(0,0,0,0.1)]">
              {capDetail}
            </div>
          }
        >
          <span
            className="inline-flex cursor-default"
            onClick={(event) => event.stopPropagation()}
          >
            {statusIndicator}
          </span>
        </Popover>
      ) : (
        statusIndicator
      )}
      <TraderAvatar wallet={wallet} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="max-w-[160px] truncate text-[16px] leading-5 text-black">
            {displayName}
          </p>
          {imported ? (
            <span className="inline-flex shrink-0 items-center rounded bg-[#EBEBEB] px-1.5 py-0.5 text-[10px] leading-[13px] text-[#909090]">
              {tCommon("imported")}
            </span>
          ) : null}
          {tag ? <TraderTagIcon tag={tag} /> : null}
        </div>
        <div className="mt-px flex min-w-0 items-center gap-1">
          <span className="truncate text-[12px] leading-[15px] text-[#909090]">
            {walletLabel}
          </span>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center p-0.5 text-[#909090] transition-opacity hover:opacity-70"
            aria-label={tCommon("copyWalletAddress")}
            onClick={onCopyWallet}
          >
            <CopyIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function WalletActionButtons({
  active,
  saving,
  onPauseToggle,
  onManage,
  onRemove,
  onClick,
  className
}: {
  active: boolean;
  saving: boolean;
  onPauseToggle: () => void;
  onManage: () => void;
  onRemove: () => void;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  className?: string;
}) {
  const t = useTranslations("copyTrade.copiedWallet");

  return (
    <div
      className={cn(copyTradeCopiedWalletColActionClass, className)}
      onClick={onClick}
    >
      <ActionButton
        label={active ? t("pauseCopiedWallet") : t("resumeCopiedWallet")}
        disabled={saving}
        onClick={onPauseToggle}
      >
        {active ? <PauseIcon /> : <PlayIcon />}
      </ActionButton>
      <ActionButton
        label={t("manageSettings")}
        disabled={saving}
        onClick={onManage}
      >
        <SettingsIcon />
      </ActionButton>
      <ActionButton
        label={t("removeCopiedWallet")}
        disabled={saving}
        onClick={onRemove}
      >
        <CloseIcon />
      </ActionButton>
    </div>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
    >
      <path d="M4 13H0V0H4V13ZM13 13H9V0H13V13Z" fill="#909090" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="13"
      viewBox="0 0 11 13"
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 0L11 6.5L0 13V0Z" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
    >
      <path
        d="M10.9098 0C9.56237 0 8.43153 0.973079 8.10501 2.27568H0.00212505V3.79286H8.10501C8.43153 5.09546 9.56237 6.06835 10.9098 6.06835C12.2571 6.06835 13.388 5.09546 13.7145 3.79286H16V2.27568H13.7145C13.388 0.973079 12.2571 0 10.9098 0ZM10.9098 1.51718C11.7096 1.51718 12.3642 2.19977 12.3642 3.03417C12.3642 3.86858 11.7096 4.55135 10.9098 4.55135C10.1099 4.55135 9.4555 3.86858 9.4555 3.03417C9.4555 2.19977 10.1099 1.51718 10.9098 1.51718ZM5.09025 5.87365C3.74287 5.87365 2.61203 6.84672 2.28551 8.14932H0V9.6665H2.28551C2.61203 10.9691 3.74287 11.942 5.09025 11.942C6.43761 11.942 7.56829 10.9691 7.89481 9.6665H15.9977V8.14932H7.89481C7.56829 6.84672 6.43761 5.87365 5.09025 5.87365ZM5.09025 7.39083C5.89014 7.39083 6.54451 8.07342 6.54451 8.90782C6.54451 9.74222 5.89014 10.425 5.09025 10.425C4.29036 10.425 3.63582 9.74222 3.63582 8.90782C3.63582 8.07342 4.29036 7.39083 5.09025 7.39083ZM10.9076 11.9317C9.56019 11.9317 8.42935 12.9046 8.10289 14.2073H0V15.7243H8.10289C8.42941 17.0269 9.56024 18 10.9076 18C12.255 18 13.3857 17.0269 13.7122 15.7243H15.9977V14.2073H13.7124C13.3859 12.9046 12.2551 11.9317 10.9076 11.9317ZM10.9076 13.4486C11.7075 13.4486 12.3619 14.1314 12.3619 14.9658C12.3619 15.8002 11.7075 16.4828 10.9076 16.4828C10.1077 16.4828 9.45319 15.8002 9.45319 14.9658C9.45319 14.1314 10.1077 13.4486 10.9076 13.4486Z"
        fill="#909090"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
    >
      <path
        d="M1.18306 0.168867L1.22244 0.204509L6.08801 5.00056L10.7746 0.381304C10.9054 0.251113 11.0824 0.176171 11.2683 0.172324C11.4542 0.168478 11.6343 0.236028 11.7705 0.360692C11.9068 0.485355 11.9885 0.657359 11.9984 0.840332C12.0083 1.0233 11.9456 1.2029 11.8236 1.34115L11.7878 1.37997L7.10051 5.99851L11.7874 10.6178C11.9197 10.7466 11.9958 10.9212 11.9998 11.1044C12.0038 11.2876 11.9354 11.4652 11.8089 11.5996C11.6824 11.734 11.5079 11.8146 11.3222 11.8244C11.1365 11.8342 10.9542 11.7724 10.814 11.6521L10.7746 11.6161L6.08801 6.99682L1.22244 11.7932C1.09143 11.9224 0.914729 11.9965 0.729464 11.9999C0.5442 12.0033 0.364803 11.9358 0.228979 11.8116C0.0931554 11.6873 0.0114806 11.516 0.00112092 11.3337C-0.00923877 11.1513 0.0525232 10.9721 0.173426 10.8337L0.209587 10.7949L5.07552 5.99851L0.209945 1.20282C0.0798237 1.07353 0.00544039 0.899676 0.00234498 0.717593C-0.00075042 0.53551 0.0676815 0.359295 0.193336 0.225786C0.31899 0.0922763 0.492139 0.0118068 0.676587 0.00119928C0.861036 -0.00940825 1.0425 0.0506673 1.18306 0.168867Z"
        fill="#909090"
      />
    </svg>
  );
}
