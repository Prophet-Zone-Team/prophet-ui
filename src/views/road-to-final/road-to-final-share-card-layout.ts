import type { ShareCardStageKey } from "./lib/build-share-card-stages";

export type ShareCardOverlayRect = {
  labelTop: string;
  labelLeft: string;
  flagsTop: string;
  flagsLeft: string;
  flagsGap: string;
  flagSize: string;
  groupFlagSize?: string;
};

export const ROAD_SHARE_CARD_FOOTER = {
  qrTop: "86%",
  qrLeft: "4.1%",
  qrSizePx: 32,
  inviteTop: "90.8%",
  inviteLeft: "22%",
  inviteMaxWidth: "42%",
};
