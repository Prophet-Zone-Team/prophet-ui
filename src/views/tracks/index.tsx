"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";

import { trackTrackPageViewed } from "@/lib/analytics/tracking";

import { useAuth } from "@/context/auth";
import { mapProphetTracksToCardProps } from "@/lib/tracks/prophet-track-mapper";
import { useTracksHydrated, useTracksItems, useTracksStore } from "@/store";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";
import { TracksEmptyState } from "./empty";
import TracksTitle from "./title";
import { TrackCard } from "./track-card";
import { TracksListSkeleton, TopAttentionSkeleton } from "./tracks-loading";
import { useProphetTopTracks } from "@/hooks/tracks/use-prophet-top-tracks";
import { useTracksTelegramBind } from "@/hooks/tracks/use-tracks-telegram-bind";
import { TopAttentionCard } from "./top-attention-card";
import { TopAttentionEmptyState } from "./top-attention-empty";
import TracksTelegramBanner from "./tg";
import { TracksUnauthenticatedState } from "./unauthenticated";

export function TracksView() {
  useEffect(() => {
    trackTrackPageViewed();
  }, []);

  const t = useTranslations("tracks");
  const authHydrated = useAuthHydrated();
  const tracksHydrated = useTracksHydrated();
  const { isAuthenticated, openLoginModalOnly, loginInProgress, session } = useAuth();
  const {
    bound: telegramBound,
    loadStatus: telegramLoadStatus,
    setBoundOptimistic: setTelegramBoundOptimistic
  } = useTracksTelegramBind({
    authHydrated,
    enabled: isAuthenticated,
    walletAddress: session?.walletAddress
  });
  const items = useTracksItems();
  const status = useTracksStore((state) => state.status);
  const errorMessage = useTracksStore((state) => state.error);
  const fetchTracks = useTracksStore((state) => state.fetchTracks);
  const {
    cards: topAttentionCards,
    isLoading: topAttentionLoading,
    isError: topAttentionError,
    refetch: refetchTopAttention
  } = useProphetTopTracks();

  const trackCards = useMemo(() => mapProphetTracksToCardProps(items), [items]);

  const trackGameMatches = useMemo(
    () =>
      trackCards
        .filter((card) => card.variant === "game")
        .map((card) => card.match),
    [trackCards]
  );

  const topAttentionTeamCards = useMemo(
    () => topAttentionCards.filter((card) => card.variant !== "match"),
    [topAttentionCards]
  );

  const topAttentionMatchCards = useMemo(
    () => topAttentionCards.filter((card) => card.variant === "match"),
    [topAttentionCards]
  );

  const loadTracks = useCallback(async () => {
    await fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    if (!authHydrated || !tracksHydrated) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    void loadTracks();
  }, [authHydrated, tracksHydrated, isAuthenticated, loadTracks]);

  async function handleConnectWallet() {
    try {
      await openLoginModalOnly();
      await loadTracks();
    } catch (error) {
      console.warn("[tracks] wallet connect failed", error);
    }
  }

  function renderMainContent() {
    if (!authHydrated || !tracksHydrated) {
      return <TracksListSkeleton count={2} />;
    }

    if (!isAuthenticated) {
      return (
        <TracksUnauthenticatedState
          onConnect={() => void handleConnectWallet()}
          connecting={loginInProgress}
        />
      );
    }

    const showLoadingState =
      (status === "loading" || status === "idle") && trackCards.length === 0;

    if (showLoadingState) {
      return <TracksListSkeleton />;
    }

    if (trackCards.length === 0) {
      return <TracksEmptyState />;
    }

    return (
      <div className="flex flex-col gap-3">
        {trackCards.map((card) => (
          <TrackCard
            key={
              card.variant === "game" ? card.match.id : card.snapshot.team.id
            }
            {...card}
          />
        ))}
      </div>
    );
  }

  function renderTopAttention() {
    if (topAttentionLoading) {
      return <TopAttentionSkeleton />;
    }

    if (topAttentionError) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="m-0 text-center text-[14px] text-prophet-muted">
            {t("topAttentionLoadError")}
          </p>
          <button
            type="button"
            onClick={() => void refetchTopAttention()}
            className="rounded-[8px] border border-prophet-line bg-prophet-panel px-4 py-2 text-[14px] font-[500] text-prophet-foreground transition-colors hover:bg-prophet-hover"
          >
            {t("retry")}
          </button>
        </div>
      );
    }

    if (topAttentionCards.length === 0) {
      return <TopAttentionEmptyState />;
    }

    return (
      <div className="flex flex-col gap-[4px]">
        {topAttentionTeamCards.length > 0 ? (
          <div className="flex flex-wrap gap-[4px]">
            {topAttentionTeamCards.map((card) => (
              <TopAttentionCard key={card.snapshot.team.id} {...card} />
            ))}
          </div>
        ) : null}
        {topAttentionMatchCards.length > 0 ? (
          <div className="flex flex-wrap gap-[4px]">
            {topAttentionMatchCards.map((card) => (
              <TopAttentionCard key={card.match.id} {...card} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1436px] px-3 py-6 md:px-4 md:py-8">
      <SyncMatchLiveStore matches={trackGameMatches} />
      <div className="mx-auto w-full md:w-[1260px]">
        <TracksTitle />
        {errorMessage ? (
          <p className="mt-4 text-center text-[14px] text-prophet-muted">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-6">{renderMainContent()}</div>
        <TracksTelegramBanner
          telegramBound={telegramBound}
          telegramLoadStatus={telegramLoadStatus}
          onTelegramBound={setTelegramBoundOptimistic}
        />
      </div>
      <div className="mt-3 lg:mt-4">
        <div className="my-5 text-base font-[500] text-prophet-foreground md:mt-4 md:text-[18px]">
          {t("topAttention")}
        </div>
        {renderTopAttention()}
      </div>
    </section>
  );
}
