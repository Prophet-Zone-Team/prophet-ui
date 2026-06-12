"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";

import { useAuth } from "@/context/auth";
import { mapProphetTracksToCardProps } from "@/lib/tracks/prophet-track-mapper";
import {
  useTracksHydrated,
  useTracksItems,
  useTracksStore
} from "@/store";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { TracksEmptyState } from "./empty";
import TracksTitle from "./title";
import { TrackCard } from "./track-card";
import { useProphetTopTracks } from "@/hooks/tracks/use-prophet-top-tracks";
import { useTracksTelegramBind } from "@/hooks/tracks/use-tracks-telegram-bind";
import { TopAttentionCard } from "./top-attention-card";
import { TopAttentionEmptyState } from "./top-attention-empty";
import TracksTelegramBanner from "./tg";
import { TracksUnauthenticatedState } from "./unauthenticated";

export function TracksView() {
  const t = useTranslations("tracks");
  const tCommon = useTranslations("common");
  const authHydrated = useAuthHydrated();
  const tracksHydrated = useTracksHydrated();
  const { isAuthenticated, openLogin, loginInProgress, session } = useAuth();
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

  const trackCards = useMemo(
    () => mapProphetTracksToCardProps(items),
    [items]
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
      await openLogin();
      await loadTracks();
    } catch (error) {
      console.warn("[tracks] wallet connect failed", error);
    }
  }

  function renderMainContent() {
    if (!authHydrated || !tracksHydrated) {
      return (
        <p className="py-[60px] text-center text-[16px] text-[#909090]">
          {tCommon("loading")}
        </p>
      );
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
      return (
        <p className="py-[60px] text-center text-[16px] text-[#909090]">
          {t("loadingTracks")}
        </p>
      );
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
      return (
        <p className="py-8 text-center text-[14px] text-[#909090]">
          {t("loadingTopAttention")}
        </p>
      );
    }

    if (topAttentionError) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="m-0 text-center text-[14px] text-[#909090]">
            {t("topAttentionLoadError")}
          </p>
          <button
            type="button"
            onClick={() => void refetchTopAttention()}
            className="rounded-[8px] border border-[#EBEBEB] bg-white px-4 py-2 text-[14px] font-[500] text-black"
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
              <TopAttentionCard
                key={card.snapshot.team.id}
                {...card}
              />
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
      <div className="mx-auto w-[1260px]">
        <TracksTitle />
        {errorMessage ? (
          <p className="mt-4 text-center text-[14px] text-[#909090]">
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
        <div className="my-5 text-base font-[500] text-black md:mt-4 md:text-[18px]">
          {t("topAttention")}
        </div>
        {renderTopAttention()}
      </div>
    </section>
  );
}
