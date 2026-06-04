export const REFERRAL_ACTIVITY_PAGE_SIZE = 10;

export const REFERRAL_PATH = "/fifa";

export const REFERRAL_QUERY_PARAM = "r";

export const REFERRAL_STALE_TIME_MS = 60_000;

export const REFERRAL_KICKBACK_DESCRIPTION =
  "You earn a percentage of Prophet's actual revenue from your referred users' completed orders.";

/** Set to true to render the empty-state referral panel for local QA. */
export const REFERRAL_USE_EMPTY_STATE = false;

export const REFERRAL_SHARE_CARD_IMAGE_PATH = "/referral/share-card.png";

/** Fixed export size matching share-card.png (px). */
export const REFERRAL_SHARE_CARD_WIDTH = 308;

export const REFERRAL_SHARE_CARD_HEIGHT = 394;

/** Padding on capture wrapper so box-shadow is not clipped in PNG export. */
export const REFERRAL_SHARE_CARD_EXPORT_PADDING = 4;

export const REFERRAL_SHARE_CARD_DOWNLOAD_FILENAME = "prophet-referral-card.png";

/** Placeholder until product provides share URLs. */
export const REFERRAL_TWITTER_SHARE_URL = "";

/** Placeholder until product provides share URLs. */
export const REFERRAL_TELEGRAM_SHARE_URL = "";

export { COPIED_TOAST_VISIBLE_MS } from "@/lib/clipboard/config";
