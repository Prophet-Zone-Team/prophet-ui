"use client";

import { createContext, useContext } from "react";

import type { ProphetBookmarkTarget } from "@/lib/tracks/track-status";

type TracksListContextValue = {
  onUntracked: (target: ProphetBookmarkTarget) => void;
};

const TracksListContext = createContext<TracksListContextValue | null>(null);

export function TracksListProvider({
  children,
  onUntracked
}: {
  children: React.ReactNode;
  onUntracked: (target: ProphetBookmarkTarget) => void;
}) {
  return (
    <TracksListContext.Provider value={{ onUntracked }}>
      {children}
    </TracksListContext.Provider>
  );
}

export function useTracksListOnUntracked():
  | ((target: ProphetBookmarkTarget) => void)
  | undefined {
  return useContext(TracksListContext)?.onUntracked;
}
