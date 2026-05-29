"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth";
import { mapProphetTracksToCardProps } from "@/lib/tracks/prophet-track-mapper";
import {
  clearTrackStatus,
  hydrateTrackStatusFromApiItems
} from "@/lib/tracks/track-status";
import {
  getProphetTracks,
  isProphetAuthenticated,
  ProphetApiError,
  syncProphetWalletLogin
} from "@/service/prophet";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import type { ProphetUserTrackItem } from "@/types/prophet-api";
import { TracksEmptyState } from "./empty";
import TracksTitle from "./title";
import { TrackCard } from "./track-card";
import { TopAttentionEmptyState } from "./top-attention-empty";
import TracksTelegramBanner from "./tg";
import { TracksUnauthenticatedState } from "./unauthenticated";

type TracksLoadStatus = "idle" | "loading" | "ready" | "error";

export function TracksView() {
  const authHydrated = useAuthHydrated();
  const { isAuthenticated, session, openLogin, loginInProgress } = useAuth();
  const [tracks, setTracks] = useState<ProphetUserTrackItem[]>([]);
  const [status, setStatus] = useState<TracksLoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const trackCards = useMemo(
    () => mapProphetTracksToCardProps(tracks),
    [tracks]
  );

  const loadTracks = useCallback(async () => {
    if (!session?.walletAddress) {
      setTracks([]);
      clearTrackStatus();
      setStatus("ready");
      setErrorMessage(undefined);
      return;
    }

    setStatus("loading");
    setErrorMessage(undefined);

    try {
      await syncProphetWalletLogin(session.walletAddress);

      if (!isProphetAuthenticated()) {
        setTracks([]);
        clearTrackStatus();
        setStatus("ready");
        return;
      }

      const items = await getProphetTracks();
      setTracks(items ?? []);
      hydrateTrackStatusFromApiItems(items ?? []);
      setStatus("ready");
    } catch (error) {
      console.warn("[tracks] failed to load user tracks", error);
      setTracks([]);
      clearTrackStatus();

      if (error instanceof ProphetApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unable to load tracks.");
      }

      setStatus("error");
    }
  }, [session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }

    if (!isAuthenticated) {
      setTracks([]);
      clearTrackStatus();
      setStatus("ready");
      setErrorMessage(undefined);
      return;
    }

    void loadTracks();
  }, [authHydrated, isAuthenticated, loadTracks]);

  async function handleConnectWallet() {
    try {
      await openLogin();
      await loadTracks();
    } catch (error) {
      console.warn("[tracks] wallet connect failed", error);
    }
  }

  function renderMainContent() {
    if (!authHydrated) {
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

    if (status === "loading" || status === "idle") {
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
              card.variant === "game"
                ? card.match.id
                : card.snapshot.team.id
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
