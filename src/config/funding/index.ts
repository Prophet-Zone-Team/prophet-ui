export * from "@/config/funding/networks";
export * from "@/config/funding/tokens";

export const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === "production";
export const MAIN_DOMAIN = "prophet.zone";
export const PRIVATE_MODE_HOSTNAME = IS_PRODUCTION ? "private.prophet.zone" : "private-test.prophet.zone";
export const MAIN_HOSTNAME = IS_PRODUCTION ? "app.prophet.zone" : "test.prophet.zone";

export function isPrivateModeHost(hostname: string): boolean {
  return PRIVATE_MODE_HOSTNAME === hostname;
}

