"use client";

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
import { TopAttentionEmptyState } from "./top-attention-empty";
import TracksTelegramBanner from "./tg";
import { TracksUnauthenticatedState } from "./unauthenticated";

export function TracksView() {
  const authHydrated = useAuthHydrated();
  const tracksHydrated = useTracksHydrated();
  const { isAuthenticated, openLogin, loginInProgress } = useAuth();
  const items = useTracksItems();
  const status = useTracksStore((state) => state.status);
  const errorMessage = useTracksStore((state) => state.error);
  const fetchTracks = useTracksStore((state) => state.fetchTracks);

  const trackCards = useMemo(
    () => mapProphetTracksToCardProps(items),
    [items]
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
          Loading…
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
          Loading tracks…
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

  return (
    <section className="mx-auto w-full max-w-[1406px] px-3 py-6 md:px-4 md:py-8">
      <TracksTitle />
      {errorMessage ? (
        <p className="mt-4 text-center text-[14px] text-[#909090]">
          {errorMessage}
        </p>
      ) : null}
      <div className="mt-6">{renderMainContent()}</div>
      <TracksTelegramBanner />
      <div className="mt-5 text-base font-[500] text-black md:mt-4 md:text-[18px]">
        Top Attention
      </div>
      <div className="mt-3 lg:mt-4">
        <TopAttentionEmptyState />
      </div>
    </section>
  );
}
