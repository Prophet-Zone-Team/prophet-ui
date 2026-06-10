export * from "@/config/funding/networks";
export * from "@/config/funding/tokens";

export const MAIN_DOMAIN = "prophet.zone";
export const PRIVATE_MODE_HOSTNAME = "private-test.prophet.zone";
export const MAIN_HOSTNAME = "dev.prophet.zone";

export function isPrivateModeHost(hostname: string): boolean {
  return PRIVATE_MODE_HOSTNAME === hostname;
}

