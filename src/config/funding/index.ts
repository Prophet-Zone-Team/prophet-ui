export * from "@/config/funding/networks";
export * from "@/config/funding/prices";
export * from "@/config/funding/tokens";

export const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_MAIN_DOMAIN?.trim() || "prophet.zone";
export const MAIN_HOSTNAME =
  process.env.NEXT_PUBLIC_MAIN_HOSTNAME?.trim() || "dev.prophet.zone";
export const PRIVATE_MODE_HOSTNAME =
  process.env.NEXT_PUBLIC_PRIVATE_MODE_HOSTNAME?.trim() || "private.prophet.zone";

export function isPrivateModeHost(hostname: string): boolean {
  return PRIVATE_MODE_HOSTNAME === hostname;
}
