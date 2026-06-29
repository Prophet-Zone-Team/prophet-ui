"use client";

import { useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { cn } from "@/lib/cn";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { useAuthStore } from "@/store/auth-store";
import { UserProfileCard } from "@/views/copy-trade/user-profile/user-profile-card";
import { useCopyTradeSession } from "@/views/copy-trade/use-copy-trade-session";
import { useCopyTradeTracks } from "@/views/copy-trade/use-copy-trade-tracks";

import { ImportWalletModal } from "@/views/copy-trade/import-wallet-modal";

import { TracksList } from "./tracks";
import { LatestList } from "./latest";

const ACTIVITY_TABS = [
  { id: "tracks", label: "Tracks" },
  { id: "latest", label: "Latest" }
] as const;

type ActivityTabId = (typeof ACTIVITY_TABS)[number]["id"];

export interface CopyTradeActivityPanelProps {
  className?: string;
}

export function CopyTradeActivityPanel({
  className
}: CopyTradeActivityPanelProps) {
  const [tab, setTab] = useState<ActivityTabId>("tracks");
  const [importOpen, setImportOpen] = useState(false);
  const authHydrated = useAuthHydrated();
  const prophetWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress
  );
  const { userId } = useCopyTradeSession();
  const importDisabled = !authHydrated || !prophetWalletAddress || !userId;
  const { tracks, isLoading: tracksLoading } = useCopyTradeTracks({
    enabled: tab === "tracks"
  });
  const showTracksImportButton =
    tab === "tracks" && !tracksLoading && tracks.length > 0;

  const handleImportClick = () => {
    if (!importDisabled) {
      setImportOpen(true);
    }
  };

  return (
    <UserProfileCard
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden p-2",
        className
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 p-3 pb-0">
        <TabSwitcher
          items={ACTIVITY_TABS.map((item) => ({
            id: item.id,
            label: item.label
          }))}
          value={tab}
          onChange={(value) => setTab(value as ActivityTabId)}
          aria-label="Copy trade activity tabs"
          tabLabelClassName="leading-5"
        />
        {showTracksImportButton ? (
          <button
            type="button"
            disabled={importDisabled}
            className={cn(
              "inline-flex h-[30px] w-[77px] shrink-0 items-center justify-center rounded-lg border border-[#909090] text-[14px] leading-[18px] text-black transition-opacity",
              importDisabled
                ? "cursor-not-allowed opacity-30"
                : "opacity-50 hover:opacity-70"
            )}
            onClick={handleImportClick}
          >
            Import
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            tab === "tracks" ? undefined : "hidden"
          )}
        >
          <TracksList
            className="min-h-0 flex-1"
            enabled={tab === "tracks"}
            importDisabled={importDisabled}
            onImport={handleImportClick}
          />
        </div>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            tab === "latest" ? undefined : "hidden"
          )}
        >
          <LatestList className="min-h-0 flex-1" enabled={tab === "latest"} />
        </div>
      </div>

      <ImportWalletModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </UserProfileCard>
  );
}
